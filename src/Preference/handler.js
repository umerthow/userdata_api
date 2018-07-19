const _ = require('lodash');
const util = require('../util.js');
const config = require('config');
const redis = require('../redis.js');
const query = require('../query.js');

const HandlerPreference = {};

let getPreferenceData = (pf, useRelationships, projectId) => {
    let data = util.newJSONAPIObject();

    return new Promise((finalResolve, finalReject) => {
        new Promise((resolve, reject) => {
            resolve(pf);
        }).then((result) => {
            return result.map((pl) => {
                return new Promise((resolve, reject) => {
                    util.createPreferenceJSON(pl, useRelationships, projectId).then((res) => {
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
    })
}

HandlerPreference.getPreferenceByID = (req, res, next) => {
    let preferenceID = req.params.id;
    const projectId = _.get(res, 'locals.projectId', null);

    let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1;

    //get Preference from redis
    client.getPreferenceById(preferenceID, projectId).then((result) => {
        return new Promise((resolve, reject) => {
            if (result != null) {
                let arrResult = [];
                if (result != 'undefined') {
                    arrResult.push(result);
                }
                resolve(arrResult);
            } else {
                query.getPreferenceByIDs(preferenceID, projectId).then((result) => {
                    // add to redis
                    client.setPreferenceById(playlistID, result[0], ttl, projectId);

                    resolve(result);
                })
            }
        })
    }).then((result) => {
        return getPreferenceData(result, useRelationships, projectId);
    }).then((data) => {
        res.setHeader('content-type', 'application/vnd.api+json');
        res.json(data);
    }).catch(function (err) {
        return next(err);
    })


}

module.exports = HandlerPreference;