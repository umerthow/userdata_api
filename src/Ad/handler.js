const query = require('../query.js');
const config = require('config');
const util = require('../util.js');
const redis = require('../redis.js');
const token = require('../token.js')
const xmlBuilder = require('xmlbuilder');
const VAST = require('vast-xml');
const APIClient = require('@supersoccer/api-client').default;
const _ = require('lodash');

const apiClient = new APIClient({
  appKey: config.apiClient.key,
  appSecret: config.apiClient.secret,
  apiDomain: config.apiClient.domain
})

// redis client
const client = new redis(config.redis.port, config.redis.host);
const ttl = config.redis.ttl;

let generateVast = (userId, clientIp, result) => {
  // generate token
  var stream = {
    source: 'vos360',
    baseUrl: result.url
  };
  return new Promise((resolve, reject) => {
    token.embedToken(userId, clientIp, stream).then((streamUrl) => {
      // create vast object
      let vast = new VAST();
      let ad = vast.attachAd({
        id : result.id,
        structure : 'inline',
        sequence : 99,
        Error: '',
        AdTitle : result.title,
        AdSystem : {name: 'SSTV Ads', version : '1.0'}
      });
      let creative = ad.attachCreative('Linear', {
        AdParameters : '<xml></xml>',
        Duration : result.duration,
        skipoffset: result.skip_offset
      });
      creative.attachMediaFile(streamUrl, {
        id: 1,
        type: result.type,
        bitrate: result.bitrate,
        width: result.width,
        height: result.height,
        delivery: "progressive",
        scalable: "true",
        maintainAspectRatio: "true",
        codec: ""
      });

      resolve(vast);
    })
  })
}

const HandlerAd = {};

HandlerAd.getAd = (req, res, next) => {
  let userId = req.user ? req.user.sub : undefined;
  let videoId = req.params.id;
  let baseUrl = 'https://' + req.get('host') + '/v1/videos';
  let data = util.newJSONAPIObject();

  const projectId = _.get(res, 'locals.projectId', null);

  let p = new Promise((resolve, reject) => {
    if (userId != undefined) {
      apiClient.service.subscription.getUserSubscriptions(userId, {
        autoInjectAccessToken: config.scope.userReadGlobal,
        relationships: false
      }).then((subscriptions) => {
        if (subscriptions.some(e => e.subscriptionId === 1)) { // check if free user
          resolve();
        } else {
          // return no ads
          res.set('Content-Type', 'application/vnd.api+json');
          res.json(data);
          return;
        }
      })
    } else {
      resolve();
    }
  }).then(() => {
    return new Promise((resolve, reject) => {
      // get ad
      client.getAd(projectId).then((result) => {
        if (result != null) {
          // get random ads
          let idx = Math.floor(Math.random()*result.length);
          resolve(result[idx]);
        } else {
          query.getAds(projectId).then((result) => {
            if (result != null) {
              client.setAd(result, ttl, projectId);
            }
            // get random ads
            let idx = Math.floor(Math.random()*result.length);
            resolve(result[idx]);
          })
        }
      })
    })
  }).then((result) => {
    if (result != null) {
      let definitions = [];
      let protocols = ['vast', 'vmap'];
      protocols.map((protocol) => {
        definitions.push({
          standard: protocol,
          url: `${baseUrl}/ads/${result.id}/${protocol}`
        });
      });
      let ad = {
        id: result.id,
        position: 'pre',
        definitions: definitions
      }
      data.data.push(util.createAdJSON(ad));
    }

    res.set('Content-Type', 'application/vnd.api+json');
    res.json(data);
  }).catch((err) => {
    return next(err);
  })
}

HandlerAd.getAdXml = (req, res, next) => {
  const projectId = _.get(res, 'locals.projectId', null);

  let protocol = req.params.protocol; // ads protocol (vast/vmap)
  if (protocol == 'vast') {
    HandlerAd.getVast(req, res, next);
  } else if (protocol == 'vmap') {
    HandlerAd.getVmap(req, res, next);
  } else {
    return util.responseError(res, {
      message: 'Ads protocol not supported'
    }, 200);
  }
}

HandlerAd.getVmap = (req, res, next) => {
  let userId = req.user ? req.user.sub : undefined;
  let clientIp = req.ip;
  let adId = req.params.id;

  const projectId = _.get(res, 'locals.projectId', null);

  // get ad
  client.getAdById(adId, projectId).then((result) => {
    return new Promise((resolve, reject) => {
      if (result != null) {
        resolve(result);
      } else {
        query.getAdById(adId, projectId).then((result) => {
          if (result != null) {
            client.setAdById(adId, result, ttl, projectId);
          }
          resolve(result);
        })
      }
    })
  }).then((result) => {
    let vast;
    return new Promise((resolve, reject) => {
      // check if no ad
      if (result == null) {
        vast = new VAST({VASTErrorURI: 'http://adserver.com/noad.gif'});
        resolve(vast);
      } else {
        generateVast(userId, clientIp, result).then((result) => {
          vast = result;
          resolve(vast);
        });
      }
    })
  }).then((vast) => {
    let vastXml = vast.xml({ pretty : true, indent : '  ', newline : '\n' });
    vastXml = vastXml.substr(39); // remove xml declaration
    let vmap = xmlBuilder.create('vmap:VMAP')
      .att({'xmlns:vmap': '//www.iab.net/vmap-1.0', 'version': '1.0'})
      .ele('vmap:AdBreak', {'breakType': 'linear', 'breakId': 'prerolls', 'timeOffset': 'start'})
        .ele('vmap:AdSource', {'allowMultipleAds': 'true', 'followRedirects': 'true', 'id': '1'})
          .ele('VASTData')
            .raw(vastXml)
      .end({ pretty: true});

    // generate xml
    res.set('Content-Type', 'text/xml');
    res.send(vmap);
  }).catch((err) => {
    return next(err);
  })
}

HandlerAd.getVast = (req, res, next) => {
  let userId = req.user ? req.user.sub : undefined;
  let clientIp = req.ip;
  let adId = req.params.id;

  const projectId = _.get(res, 'locals.projectId', null);

  // get ad
  client.getAdById(adId, projectId).then((result) => {
    return new Promise((resolve, reject) => {
      if (result != null) {
        resolve(result);
      } else {
        query.getAdById(adId, projectId).then((result) => {
          if (result != null) {
            client.setAdById(adId, result, ttl, projectId);
          }
          resolve(result);
        })
      }
    })
  }).then((result) => {
    let vast;
    return new Promise((resolve, reject) => {
      // check if no ad
      if (result == null) {
        vast = new VAST({VASTErrorURI: 'http://adserver.com/noad.gif'});
        resolve(vast);
      } else {
        generateVast(userId, clientIp, result).then((result) => {
          vast = result;
          resolve(vast);
        });
      }
    })
  }).then((vast) => {
    // generate xml
    let xml = vast.xml({ pretty : true, indent : '  ', newline : '\n' });
    res.set('Content-Type', 'text/xml');
    res.send(xml);
  }).catch((err) => {
    return next(err);
  })
}

module.exports = HandlerAd;
