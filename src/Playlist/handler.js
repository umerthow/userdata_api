const query = require('../query.js');
const config = require('config');
const util = require('../util.js');
const _ = require('lodash');
const redis = require('../redis.js');

// redis client
const client = new redis(config.redis.port, config.redis.host);
const ttl = config.redis.ttl;

const HandlerPlaylist = {};

let getPlaylistData = (pl, useRelationships, projectId) => {
  let data = util.newJSONAPIObject();

  return new Promise((finalResolve, finalReject) => {
    new Promise((resolve, reject) => {
      resolve(pl);
    }).then((result) => {
      return result.map((pl) => {
        return new Promise((resolve, reject) => {
          util.createPlaylistWithVideoJSON(pl, useRelationships, projectId).then((res) => {
            data.data.push(res);
            resolve();
          })
        })
      })
    }).then((promises) => {
      return new Promise((resolve, reject) => {
        Promise.all(promises).then(() => {
          resolve();
        })
      })
    })
      //get unique video id to include them into json result
      .then(() => {
        if (!useRelationships) {
          return Promise.resolve([]);
        }

        let videoIds = [];

        for (let pl of data.data) {
          for (let vid of pl.relationships.video.data) {
            videoIds.push(vid.id);
          }
        }

        return Promise.resolve(_.uniq(videoIds));
      }).then((videoIds) => {

        var videos = [];
        var getVideos = [];
        return new Promise((resolve, reject) => {
          videoIds.map((videoId) => {
            getVideos.push(
              new Promise((resolve, reject) => {
                client.getVideoById(videoId, projectId).then((result) => {
                  if (result != null) {
                    videos.push(result);
                    resolve();
                  } else {
                    query.getVideo(videoId, projectId).then((result) => {
                      if (result.length) {
                        videos.push(result[0]);
                        client.setVideoById(videoId, result[0], ttl, projectId);
                      }
                      resolve();
                    });
                  }
                })
              })
            )
          })
          Promise.all(getVideos).then(() => {
            resolve(videos);
          })
        })
      }).then((result) => {
        for (let vid of result) {
          data.included.push(util.createVideoJSON(vid, 0, 0));
        }
      })
      //get unique team id to include them into json result
      .then(() => {
        let teamIDs = [];

        for (let vid of data.included) {
          //continue if type is not a video or the relationships are not available
          if (vid.type != 'video' || _.isUndefined(vid.relationships)) {
            continue
          }

          if (typeof vid.relationships.home !== 'undefined') {
            teamIDs.push(vid.relationships.home.data.id);
          }
          if (typeof vid.relationships.away !== 'undefined') {
            teamIDs.push(vid.relationships.away.data.id);
          }
        }

        return Promise.resolve(_.uniq(teamIDs));
      }).then((teamIDs) => {
        return util.getTeamByIDs(teamIDs);
      }).then((result) => {
        for (let te of result) {
          data.included.push(te);
        }
        return Promise.resolve();
      }).then(() => {
        if (!useRelationships) {
          return Promise.resolve();
        }

        // include subplaylists data for all playlists fetched
        let getSubplaylists = [];
        data.data.map((playlist) => {
          playlist.relationships.subplaylist.data.map((subplaylist) => {
            getSubplaylists.push(
              new Promise((resolve, reject) => {
                client.getPlaylistById(subplaylist.id, projectId).then((result) => {
                  if (result != null) {
                    if (result != 'undefined') {
                      data.included.push(util.createPlaylistJSON(result));
                    }
                    resolve();
                  } else {
                    query.getPlaylistByID(subplaylist.id, projectId).then((result) => {
                      data.included.push(util.createPlaylistJSON(result[0]));
                      client.setPlaylistById(subplaylist.id, result[0], ttl, projectId);
                      resolve();
                    })
                  }
                })
              })
            )
          })
        })

        return new Promise((resolve, reject) => {
          Promise.all(getSubplaylists).then(() => {
            resolve();
          })
        })
      }).then(() => {
        finalResolve(data);
      })
  })

}

HandlerPlaylist.getAllPlaylists = (req, res, next) => {
  let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1;

  const projectId = _.get(res, 'locals.projectId', null);

  // try get resource from redis
  client.getAllPlaylistIds(projectId).then((result) => {
    return new Promise((resolve, reject) => {
      if (result != null) {
        let playlists = [];
        let getPlaylists = [];
        result.map((playlistId) => {
          getPlaylists.push(
            new Promise((resolve, reject) => {
              client.getPlaylistById(playlistId, projectId).then((result) => {
                if (result != null) {
                  if (result != 'undefined') {
                    playlists.push(result);
                  }
                  resolve();
                } else {
                  query.getPlaylistByID(playlistId, projectId).then((result) => {
                    playlists.push(result[0]);
                    client.setPlaylistById(playlistId, result[0], ttl, projectId);
                    resolve();
                  });
                }
              })
            })
          )
        })
        Promise.all(getPlaylists).then(() => {
          resolve(playlists);
        })
      } else {
        query.getAllPlaylists(projectId).then((result) => {
          // add to redis
          let playlistIds = [];
          result.map((playlist) => {
            playlistIds.push(playlist.id);
          })
          client.setAllPlaylistIds(playlistIds, ttl, projectId);

          resolve(result);
        })
      }
    })
  }).then((result) => {
    return getPlaylistData(result, useRelationships, projectId);
  }).then((data) => {
    res.setHeader('content-type', 'application/vnd.api+json');
    res.json(data);
  }).catch(function (err) {
    return next(err);
  })
}

HandlerPlaylist.getPlaylistsByContentType = (req, res, next) => {
  let contentType = req.params.type;
  let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1;

  let projectId = _.get(req.query, 'p', 'supersoccertv');

  // try get resource from redis
  client.getPlaylistIdsByContentType(contentType, projectId).then((result) => {
    return new Promise((resolve, reject) => {
      if (result != null) {
        let playlists = [];
        let getPlaylists = [];
        result.map((playlistId) => {
          getPlaylists.push(
            new Promise((resolve, reject) => {
              client.getPlaylistById(playlistId, projectId).then((result) => {
                if (result != null) {
                  if (result != 'undefined') {
                    playlists.push(result);
                  }
                  resolve();
                } else {
                  query.getPlaylistByID(playlistId, projectId).then((result) => {
                    playlists.push(result[0]);
                    client.setPlaylistById(playlistId, result[0], ttl, projectId);
                    resolve();
                  });
                }
              })
            })
          )
        })
        Promise.all(getPlaylists).then(() => {
          resolve(playlists);
        })
      } else {
        query.getPlaylistsByContentType(contentType, projectId).then((result) => {
          // add to redis
          let playlistIds = [];
          result.map((playlist) => {
            playlistIds.push(playlist.id);
          })
          client.setPlaylistIdsByContentType(contentType, playlistIds, ttl, projectId);

          resolve(result);
        })
      }
    })
  }).then((result) => {
    return getPlaylistData(result, useRelationships, projectId);
  }).then((data) => {
    res.setHeader('content-type', 'application/vnd.api+json');
    res.json(data);
  }).catch(function (err) {
    return next(err);
  })
}

HandlerPlaylist.getPlaylistByID = (req, res, next) => {
  let playlistID = req.params.id;

  const projectId = _.get(res, 'locals.projectId', null);

  if (playlistID.toLowerCase() === 'free') {
    console.log('TRYING TO GET FREE SUBSCRIPTION');
    res.setHeader('content-type', 'application/vnd.api+json');
    return res.json({});
  }

  let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1;

  // try get resource from redis
  client.getPlaylistById(playlistID, projectId).then((result) => {
    return new Promise((resolve, reject) => {
      if (result != null) {
        let arrResult = [];
        if (result != 'undefined') {
          arrResult.push(result);
        }
        resolve(arrResult);
      } else {
        query.getPlaylistByID(playlistID, projectId).then((result) => {
          // add to redis
          client.setPlaylistById(playlistID, result[0], ttl, projectId);

          resolve(result);
        })
      }
    })
  }).then((result) => {
    return getPlaylistData(result, useRelationships, projectId);
  }).then((data) => {
    res.setHeader('content-type', 'application/vnd.api+json');
    res.json(data);
  }).catch(function (err) {
    return next(err);
  })
}

HandlerPlaylist.postNewPlaylist = (req, res, next) => {
  let data = req.body;

  const projectId = _.get(res, 'locals.projectId', null);

  query.insertPlaylist(data.data, projectId).then(() => {
    // remove from redis
    client.delAllPlaylistIds(projectId);
    client.delPlaylistById(data.data.id, projectId);

    res.setHeader('content-type', 'application/vnd.api+json');
    res.json(data)
  }).catch(err => {
    return next(err);
  })
}

HandlerPlaylist.updatePlaylist = (req, res, next) => {
  let data = req.body;

  const projectId = _.get(res, 'locals.projectId', null);

  query.updatePlaylist(data.data, projectId).then(() => {
    // remove from redis
    client.delAllPlaylistIds(projectId);
    client.delPlaylistById(data.data.id, projectId);

    res.setHeader('content-type', 'application/vnd.api+json');
    res.json(data)
  }).catch(err => {
    return next(err);
  })
}

HandlerPlaylist.patchPlaylist = (req, res, next) => {
  let data = req.body;

  const projectId = _.get(res, 'locals.projectId', null);

  //playlist ID must be defined
  let playlistID = req.params.id;

  if (_.isUndefined(playlistID) || playlistID == '') {
    return next('undefined playlist ID');
  }

  query.patchPlaylist(playlistID, data.data, projectId).then(() => {
    // remove from redis
    client.delAllPlaylistIds(projectId);
    client.delPlaylistById(playlistID, projectId);

    res.setHeader('content-type', 'application/vnd.api+json');
    res.json(data)
  }).catch(err => {
    return next(err);
  })
}

HandlerPlaylist.deletePlaylist = (req, res, next) => {
  let playlistID = req.params.id;

  const projectId = _.get(res, 'locals.projectId', null);

  query.deletePlaylist(playlistID, projectId).then(() => {
    // remove from redis
    client.delAllPlaylistIds(projectId);
    client.delPlaylistById(playlistID, projectId);

    res.setHeader('content-type', 'application/vnd.api+json');
    res.json({ id: playlistID, success: true })
  }).catch(err => {
    return next(err);
  })
}

module.exports = HandlerPlaylist;
