// Module to generate stream token based on user subscriptions

const config = require('config');
const query = require('./query.js');
const _ = require('lodash');
const redis = require('./redis.js');
// const Akamai = require('akamai-auth-token');
const exec = require('child_process').exec;
const crypto = require('crypto');
const moment = require('moment');
const NodeCache = require( "node-cache" );

// node cache
const cache = new NodeCache();

const APIClient = require('@supersoccer/api-client').default;
const apiClient = new APIClient({
  appKey: config.apiClient.key,
  appSecret: config.apiClient.secret,
  apiDomain: config.apiClient.domain
});

// redis client
const client = new redis(config.redis.port, config.redis.host);
const ttl = config.redis.ttl;

const GUEST_USER_ID_PREFIX = 'guest';
const PERMISSION_SUBSCRIPTION = 1;
const PERMISSION_MEMBER = 2;
const PERMISSION_PUBLIC = 3;

const Token = {};

let isGuestUser = (userId) => {
  return userId && userId.startsWith(GUEST_USER_ID_PREFIX)
};

let bypassVideo = (userId, clientIp, videoId, source, streamUrl, contentTypeId, playlistIds, accessToken, isBypassed, projectId) => {
  return new Promise((resolve, reject) => {
    let getNewStreamUrl = (contentType, streamUrl, level) => {
      if(contentType == 'vod') {
        return streamUrl;
      } else if(contentType != 'live') {
        //catchup
        streamUrl = streamUrl.split('index.m3u8').join('index_C'+level+'.m3u8');
      } else {
        //live
        streamUrl = streamUrl.split('index.m3u8').join('index_L'+level+'.m3u8');
      }
      return streamUrl;
    }
    let newStreamUrl, contentType;
    let levelMap = {
      '2300':1,
      '1800':2,
      '1100':3,
      '900': 4,
      '700': 5
    };
    // get new stream url with content type and video quality
    client.getContentTypeById(contentTypeId, projectId).then((result) => {
      return new Promise((resolve, reject) => {
        if(result != null) {
          contentType = result.name;
          newStreamUrl = getNewStreamUrl(contentType, streamUrl, levelMap['2300'])
          resolve(newStreamUrl);
        } else {
          query.getContentType(contentTypeId, projectId).then((result) => {
            client.setContentTypeById(contentTypeId, result[0], ttl, projectId);
            contentType = result[0].name;
            newStreamUrl = getNewStreamUrl(contentType, streamUrl, levelMap['2300'])
            resolve(newStreamUrl);
          })
        }  
      })
    }).then((newStreamUrl) => {
      let result = {
        streamUrl: newStreamUrl
      }
      resolve(result);  
    })
  })
  .then((result) => {
    // generate token
    var stream = {
      source: source,
      baseUrl: result.streamUrl // new streamUrl with content type and video quality
    };
    return new Promise((resolve, reject) => {
      Token.embedToken(userId, clientIp, stream).then((result) => {
        resolve({error: null, streamUrl: result});
      });
    })
  })
}

let authorizeVideo = (userId, clientIp, videoId, source, streamUrl, contentTypeId, playlistIds, accessToken, isBypassed) => {
  // get user subscriptions
  return apiClient.service.subscription.getUserSubscriptions(userId, {
    autoInjectAccessToken: config.scope.userReadGlobal,
    relationships: false
  }).then((result) => {
    // get playlists based on user subscriptions
    var subscriptionPlaylistIds = [];
    var subscriptionQualityIds = []; // video qualities (SD, HD, 4K, ...)
    
    result.map((subscription) => {
      // subscription playlists
      let playlists = subscription.playlists;        
      playlists.map((playlist) => {
        if (playlist != undefined) {
          subscriptionPlaylistIds.push(playlist.id);
        }
      })
      // subscription qualities
      let qualities = subscription.qualities;
      qualities.map((quality) => {
        subscriptionQualityIds.push(quality.id);
      })  
    })
    let subscriptionPlaylists = {
      playlistIds: _.uniq(subscriptionPlaylistIds),
      qualityIds: _.uniq(subscriptionQualityIds)
    }
    return Promise.resolve(subscriptionPlaylists);

  }).then((subscriptionPlaylists) => {
    // check video playlists exists on subscription playlists
    let isAllowed = false;
    let getVideoPlaylists = [];
    let videoPlaylistIds = []; // playlist Ids and its parent Ids
    playlistIds.map((playlistId) => {
      getVideoPlaylists.push(
        new Promise((resolve, reject) => {
          client.getPlaylistById(playlistId, projectId).then((result) => {
            if(result != null) {
              if(result != 'undefined') {
                videoPlaylistIds.push(playlistId);
                if(result.parent_id != null) {
                  videoPlaylistIds = videoPlaylistIds.concat(result.parent_id.split(' ')); // convert 'a b c d e' to array  
                }
              }
              resolve();
            } else {
              query.getPlaylistByID(playlistId, projectId).then((result) => {
                if(result.length) {
                  videoPlaylistIds.push(playlistId);
                  if(result[0].parent_id != null) {
                    videoPlaylistIds = videoPlaylistIds.concat(result[0].parent_id.split(' '));  
                  }
                  client.setPlaylistById(playlistId, result[0], ttl, projectId);
                } else {
                  // playlist missing or deleted
                  client.setPlaylistById(playlistId, 'undefined', ttl, projectId);
                }
                resolve();
             })
            }
          })
        })
      )
    })
    var checkVideoPlaylists = new Promise((resolve, reject) => {
      Promise.all(getVideoPlaylists).then(() => {
        // check if video playlists exists on subscription playlists
        if(_.intersection(_.uniq(videoPlaylistIds), subscriptionPlaylists.playlistIds).length) {
          // user is allowed to access video
          isAllowed = true;
        } 
        resolve();
      })
    })
    
    // check highest video quality allowed
    let highestQuality = {};
    let videoQualities = [];
    let getVideoQualities = [];
    subscriptionPlaylists.qualityIds.map((qualityId) => {
      getVideoQualities.push(
        new Promise((resolve, reject) => {
          client.getVideoQualityById(qualityId, projectId).then((result) => {
            if(result != null) {
              videoQualities.push(result);
              resolve();
            } else {
              query.getVideoQuality(qualityId, projectId).then((result) => {
                videoQualities.push(result[0]);
                client.setVideoQualityById(qualityId, result[0], ttl, projectId);
                resolve();
              })
            }
          })    
        })
      )
    })
    var checkVideoQualities = new Promise((resolve, reject) => {
      Promise.all(getVideoQualities).then(() => {
        highestQuality = _.maxBy(videoQualities, (o) => { return o.priority; });
        resolve();
      })
    })
    
    return new Promise((resolve, reject) => {
      Promise.all([checkVideoPlaylists, checkVideoQualities]).then((result) => {
      
        let getNewStreamUrl = (contentType, streamUrl, level) => {
          if(contentType == 'vod') {
            return streamUrl;
          } else if(contentType != 'live') {
            //catchup
            streamUrl = streamUrl.split('index.m3u8').join('index_C'+level+'.m3u8');
          }else{
            //live
            streamUrl = streamUrl.split('index.m3u8').join('index_L'+level+'.m3u8');
          }
          return streamUrl;
        }
        let newStreamUrl, contentType;
        let levelMap = {
          '2300':1,
          '1800':2,
          '1100':3,
          '900': 4,
          '700': 5
        };
        // get new stream url with content type and video quality
        client.getContentTypeById(contentTypeId, projectId).then((result) => {
          return new Promise((resolve, reject) => {
            if(result != null) {
              contentType = result.name;
              newStreamUrl = getNewStreamUrl(contentType, streamUrl, levelMap[highestQuality.bitrate])
              resolve(newStreamUrl);
            } else {
              query.getContentType(contentTypeId, projectId).then((result) => {
                client.setContentTypeById(contentTypeId, result[0], ttl, projectId);
                contentType = result[0].name;
                newStreamUrl = getNewStreamUrl(contentType, streamUrl, levelMap[highestQuality.bitrate])
                resolve(newStreamUrl);
              })
            }  
          })
        }).then((newStreamUrl) => {
          let result = {
            isAllowed: isAllowed,
            streamUrl: newStreamUrl
          }
          resolve(result);  
        })
      })  
    })
  })
  .then((result) => {
    // generate token
    var stream = {
      source: source,
      baseUrl: result.streamUrl // new streamUrl with content type and video quality
    };
    return new Promise((resolve, reject) => {
      if(result.isAllowed) {
        Token.embedToken(userId, clientIp, stream).then((result) => {
          resolve({error: null, streamUrl: result});
        });
      } else {
        // user cannot access video
        resolve({error: new Error('Unathorized'), streamUrl: streamUrl})
      }  
    })
  })
}

Token.getVideoToken = (userId, clientIp, videoId, permission, source, streamUrl, contentTypeId, playlistIds, accessToken, isBypassed) => {
  if(isBypassed) { // currently used for Fira users
    return bypassVideo(userId, clientIp, videoId, source, streamUrl, contentTypeId, playlistIds, accessToken, isBypassed, projectId);
  }
  // check video permission type
  if(permission == PERMISSION_SUBSCRIPTION) {
    if(!isGuestUser(userId) && accessToken != '') {
      let result = cache.get('useSubscription'); // try check subscription toggle from node cache
      if(result != undefined) {
        if(result == 0) {
          return bypassVideo(userId, clientIp, videoId, source, streamUrl, contentTypeId, playlistIds, accessToken, isBypassed, projectId);
        } else {
          return authorizeVideo(userId, clientIp, videoId, source, streamUrl, contentTypeId, playlistIds, accessToken, isBypassed);
        }
      } else { // cache missed, try to read from redis
        return client.getSubscriptionToggle(projectId).then((result) => {
          if(result != null && result == 0) { // bypass video
            let success = cache.set('useSubscription', 0, config.cache.ttl);
            return bypassVideo(userId, clientIp, videoId, source, streamUrl, contentTypeId, playlistIds, accessToken, isBypassed, projectId)
          } else { // check user subscriptions
            if(result == null) {
              client.setSubscriptionToggle(1, projectId); // check subscription by default
            }
            let success = cache.set('useSubscription', 1, config.cache.ttl);
            return authorizeVideo(userId, clientIp, videoId, source, streamUrl, contentTypeId, playlistIds, accessToken, isBypassed)
          }
        })
      }
    } else {
      return Promise.resolve({error: new Error("Unauthorized"), streamUrl: null}); 
    }
  } else if(permission == PERMISSION_MEMBER) {
    if(!isGuestUser(userId) && accessToken != '') {
      return bypassVideo(userId, clientIp, videoId, source, streamUrl, contentTypeId, playlistIds, accessToken, isBypassed, projectId);
    } else {
      return Promise.resolve({error: new Error("Unauthorized"), streamUrl: null});
    }
  } else if(permission == PERMISSION_PUBLIC) {
    if(isGuestUser(userId) || accessToken != '') {
      return bypassVideo(userId, clientIp, videoId, source, streamUrl, contentTypeId, playlistIds, accessToken, isBypassed, projectId);
    } else {
      return Promise.resolve({error: new Error("Unauthorized"), streamUrl: null}); 
    }
  } else {
    // wrong permission type
    return Promise.resolve({error: new Error("Wrong permission type"), streamUrl: null});
  }
  
}

Token.embedVosToken = (user_id, ip, stream) => {
  var cmd = ' ' + config.Harmonics.script + ' -k ' +
    config.Harmonics.key + ' -w ' + config.Harmonics.expired + ' -S 61Z1qOqU28g2VVYl -s `date +%s` -a/*';

  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      let streamUrl = null;
      if(error != null) {
        console.log(error);
      } else {
        streamUrl = stream.baseUrl + '?' + stdout.trim();  
      }
      resolve(streamUrl);
    });  
  })
}

Token.embedBeinToken = (userId, ip, stream) => {
  var cmd = ' ' + config.Bein.script + ' -k ' +
    config.Bein.key + ' -w ' + config.Bein.expired + ' -s `date +%s` -a/*';
  
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      let streamUrl = null;
      if(error != null) {
        console.log(error);
      } else {
        streamUrl = stream.baseUrl + '?' + stdout.trim();  
      }
      resolve(streamUrl);
    });  
  })
}

Token.embedDawanToken = (userId, ip, stream) => {
  return new Promise((resolve, reject) => {
    var chunk = stream.baseUrl.split('/');
    var signedStream = 'supersoccer/' + chunk[chunk.length - 2];

    var validminutes = 5;
    var today = moment().utc().format('M/D/Y h:mm:ss A');

    var str2hash = userId + config.Dawan.key + today + validminutes + signedStream;
    var md5raw = crypto.createHash('md5').update(str2hash).digest();

    var base64hash = new Buffer(md5raw).toString('base64');
    var urlSignature = 'server_time=' + today + '&hash_value=' + base64hash + '&validminutes=' + validminutes + '&strm_len=' + signedStream.length + '&id=' + userId;

    var base64urlSignature = new Buffer(urlSignature).toString('base64');
    var streamUrl = stream.baseUrl + '?wmsAuthSign=' + base64urlSignature.trim();
    resolve(streamUrl);  
  })
}

Token.embedToken = (userId, ip, stream) => {
  return new Promise((resolve, reject) => {
    if (stream.source === 'vos360') {
      Token.embedVosToken(userId, ip, stream).then((result) => {
        resolve(result);
      });
    } else if (stream.source === 'd-awan') {
      Token.embedDawanToken(userId, ip, stream).then((result) => {
        resolve(result);
      });
    } else if (stream.source === 'bein') {
      Token.embedBeinToken(userId, ip, stream).then((result) => {
        resolve(result);
      });
    } else {
      resolve(null);
    }
  })
}

module.exports = Token;
