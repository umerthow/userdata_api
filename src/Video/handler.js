const query = require('../query.js');
const config = require('config');
const util = require('../util.js');
const token = require('../token.js')
const _ = require('lodash');
const redis = require('../redis.js');
const APIClient = require('@supersoccer/api-client').default;

const apiClient = new APIClient({
  apiDomain: config.apiClient.domain
})

// redis client
const client = new redis(config.redis.port, config.redis.host);
const ttl = config.redis.ttl;

const PERMISSION_SUBSCRIPTION = 1;
const PERMISSION_MEMBER = 2;
const PERMISSION_PUBLIC = 3;

const HandlerVideo = {};

HandlerVideo.getVideo = (req, res, next) => {
  let videoID = req.params.id;
  let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1;

  const projectId = _.get(res, 'locals.projectId', null);

  var data = util.newJSONAPIObject();
  var videoData = {};

  var getHomeTeam, getAwayTeam;

  // try get resource from redis
  client.getVideoById(videoID, projectId).then((result) => {
    return new Promise((resolve, reject) => {
      if (result != null) {
        // check video exist or not
        if (result == 'undefined') {
          return util.responseError(res, {
            message: 'No video found'
          }, 404);
        }
        resolve(result);
      } else {
        // get from db
        query.getVideo(videoID, projectId).then((result) => {
          //this should only yield 1 row
          //otherwise reject the promise
          if (result.length === 0) {
            // add to redis as not exist video
            client.setVideoById(videoID, 'undefined', ttl, projectId);

            return util.responseError(res, {
              message: 'No video found'
            }, 404);
          }
          // add to redis
          client.setVideoById(videoID, result[0], ttl, projectId);

          //if it somehow has multiple rows
          //only the first row matters
          resolve(result[0]);
        })
      }
    })
  }).then((result) => {
    return util.createVideoWithPlaylistJSON(result, useRelationships, projectId);
  })
    //get playlist and teams data to included
    .then((result) => {
      videoData = result;

      if (videoData.relationships && videoData.relationships.playlists) {
        let playlistIDS = [];
        for (let pl of videoData.relationships.playlists.data) {
          playlistIDS.push(pl.id)
        }

        return Promise.resolve(playlistIDS);
      } else {
        return Promise.resolve([]);
      }
    }).then((playlistIDS) => {
      let playlists = [];
      let getPlaylists = [];

      playlistIDS.map((playlistId) => {
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
                  if (result.length) {
                    playlists.push(result[0]);
                    client.setPlaylistById(playlistId, result[0], ttl, projectId);
                  }
                  resolve();
                })
              }
            })
          })
        )
      })
      return new Promise((resolve, reject) => {
        Promise.all(getPlaylists).then((result) => {
          resolve(playlists);
        })
      })
    }).then((result = []) => {
      data.included = data.included.concat(result.map(pl => util.createPlaylistJSON(pl)))
    })
    //get home team data
    .then(() => {
      getHomeTeam = new Promise((resolve, reject) => {
        if (videoData.relationships && videoData.relationships.home) {
          let teamID = videoData.relationships.home.data.id;
          client.getTeamById(teamID, projectId).then((result) => {
            if (result != null) {
              data.included.push(util.createTeamJSON(result));
              resolve();
            } else {
              query.getTeamByID(teamID, projectId).then((homeTeam) => {
                data.included.push(util.createTeamJSON(homeTeam[0]));
                // add to redis
                client.setTeamById(teamID, homeTeam[0], ttl, projectId);
                resolve();
              });
            }
          })
        } else {
          resolve();
        }
      });
    })
    //get away team data
    .then(() => {
      getAwayTeam = new Promise((resolve, reject) => {
        if (videoData.relationships && videoData.relationships.away) {
          let teamID = videoData.relationships.away.data.id;
          client.getTeamById(teamID, projectId).then((result) => {
            if (result != null) {
              data.included.push(util.createTeamJSON(result));
              resolve();
            } else {
              query.getTeamByID(teamID, projectId).then((awayTeam) => {
                data.included.push(util.createTeamJSON(awayTeam[0]));
                // add to redis
                client.setTeamById(teamID, awayTeam[0], ttl, projectId);
                resolve();
              });
            }
          })
        } else {
          resolve();
        }
      })
    }).then(() => {
      // get related articles
      videoData.relationships = videoData.relationships || {};
      return new Promise((resolveArticle, rejectArticle) => {
        if (useRelationships) {
          videoData.relationships.article = { data: [] };
          // get related article IDs
          client.getRelatedArticleIds(videoID, projectId).then((result) => {
            return new Promise((resolve, reject) => {
              let articleIds = [];
              if (result != null) {
                result.map((articleId) => {
                  videoData.relationships.article.data.push({ type: 'article', id: articleId });
                  articleIds.push(articleId);
                })
                resolve(articleIds);
              } else {
                query.getRelatedArticles(videoID, projectId).then((result) => {

                  result.map((article) => {
                    videoData.relationships.article.data.push({ type: 'article', id: article.article_id });
                    articleIds.push(article.article_id);
                  })
                  client.setRelatedArticleIds(videoID, articleIds, ttl, projectId);
                  resolve(articleIds);
                })
              }
            });
          }).then((articleIds) => {
            // get every articles from articles-api
            let getArticles = [];
            if (useRelationships) { // prevent infinite loops with articles-api
              articleIds.map((articleId) => {
                getArticles.push(
                  new Promise((resolve, reject) => {
                    apiClient.service.article.getArticleById(articleId, { relationships: false }).then((result) => {
                      if (result != null) {
                        data.included.push(util.createArticleJSON(result));
                      }
                      resolve();
                    })
                  })
                )
              });
            }
            Promise.all(getArticles).then(() => {
              resolveArticle();
            })
          })
        } else {
          resolveArticle();
        }
      })
    }).then(() => {
      if (!useRelationships) {
        return Promise.resolve();
      }

      // get content type to be included
      let contentTypeId = videoData.attributes.type;
      return new Promise((resolve, reject) => {
        client.getContentTypeById(contentTypeId, projectId).then((result) => {
          if (result != null) {
            data.included.push(util.createContentTypeJSON(result));
            resolve();
          } else {
            query.getContentType(contentTypeId, projectId).then((result) => {
              data.included.push(util.createContentTypeJSON(result[0]));
              client.setContentTypeById(contentTypeId, result[0], ttl, projectId);
              resolve();
            })
          }
        })
      })
    }).then(() => {
      if (!useRelationships) {
        return Promise.resolve();
      }

      // authorize video and get token
      let userId = req.user ? req.user.sub : undefined;
      let clientIp = req.ip;
      let permission = videoData.attributes.permission;
      let source = videoData.attributes.source;
      let streamUrl = videoData.attributes.streamUrl;
      let contentTypeId = videoData.attributes.type;
      let playlistIds = [];
      videoData.relationships.playlists.data.map((playlist) => {
        playlistIds.push(playlist.id);
      })
      let isBypassed = false;
      return new Promise((resolve, reject) => {
        if (userId != undefined) {
          const accessToken = req.headers['authorization'] ? req.headers['authorization'].split(' ')[1] : '';
          token.getVideoToken(userId, clientIp, videoID, permission, source, streamUrl, contentTypeId, playlistIds, accessToken, isBypassed, projectId).then((result) => {

            if (result.error != null) {
              // not authorized
              videoData.attributes.streamUrl = null;
              resolve();
            } else {
              videoData.attributes.streamUrl = result.streamUrl;
              resolve();
            }
          })
        } else {
          // not authorized
          videoData.attributes.streamUrl = null;
          resolve();
        }
      })
    }).then(() => {
      data.data.push(videoData);

      Promise.all([getHomeTeam, getAwayTeam]).then(() => {
        res.setHeader('content-type', 'application/vnd.api+json');
        res.json(data);
      })
    }).catch((err) => {
      return next(err);
    })

}

// not used, change to getSchedulesByDateAndPlaylistId
HandlerVideo.getVideosByDateAndContentType = (req, res, next) => {
  let date = req.params.date;
  let contentType = req.params.id;

  const projectId = _.get(res, 'locals.projectId', null);

  var data = util.newJSONAPIObject();

  // try get resource from redis
  client.getVideoByDateAndContentType(date, contentType, projectId).then((result) => {
    return new Promise((resolve, reject) => {
      if (result != null) {
        resolve(result);
      } else {
        // get from db
        query.getVideosByDateAndContentType(date, contentType, projectId).then((vids) => {
          // add to redis
          client.setVideoByDateAndContentType(date, contentType, vids, ttl, projectId);
          resolve(vids);
        });
      }
    })
  }).then((vids) => {
    return vids.map((vid) => {
      return new Promise((resolve, reject) => {
        util.createVideoWithPlaylistJSON(vid).then((result) => {
          data.data.push(result);
          resolve();
        })
      })
    })
  }).then((promises) => {
    Promise.all(promises).then(() => {

      res.setHeader('content-type', 'application/vnd.api+json');
      res.json(data)
    })
  }).catch((err) => {
    return next(err);
  })
}

HandlerVideo.postNewVideo = (req, res, next) => {
  let data = req.body

  const projectId = _.get(res, 'locals.projectId', null);

  query.insertVideo(data.data, projectId)
    //insert playlists relationship into table playlist_videos
    //resolve if playlists relationship is empty
    .then(() => {
      if (_.isUndefined(data.data.relationships.playlists) || data.data.relationships.playlists.data.length == 0) {
        return Promise.resolve();
      }

      let playlistIDs = [];

      for (let pl of data.data.relationships.playlists.data) {
        playlistIDs.push(pl.id);
      }

      return new Promise((resolve, reject) => {
        query.insertPlaylistVideo(_.uniq(playlistIDs, projectId), data.data.id).then(() => {
          resolve();
        })
      })
    }).then(() => {
      // insert related articles
      if (_.isUndefined(data.data.relationships.articles) || data.data.relationships.articles.data.length == 0) {
        return Promise.resolve();
      }

      let articleIds = [];

      for (let article of data.data.relationships.articles.data) {
        articleIds.push(article.id);
      }

      return new Promise((resolve, reject) => {
        query.insertRelatedArticles(_.uniq(articleIds), data.data.id, projectId).then(() => {
          resolve();
        })
      })
    }).then(() => {
      // remove from redis
      client.delVideoById(data.data.id, projectId);
      client.delPlaylistIdsByVideoId(data.data.id, projectId);

      res.setHeader('content-type', 'application/vnd.api+json');
      res.json(data)
    }).catch(err => {
      return next(err);
    })
}

HandlerVideo.updateVideo = (req, res, next) => {
  let data = req.body;

  const projectId = _.get(res, 'locals.projectId', null);

  query.updateVideo(data.data, projectId).then(() => {
    // remove from redis
    client.delVideoById(data.data.id, projectId);
    client.delPlaylistIdsByVideoId(data.data.id, projectId);

    res.setHeader('content-type', 'application/vnd.api+json');
    res.json(data)
  }).catch(err => {
    return next(err);
  })
}

HandlerVideo.patchVideo = (req, res, next) => {
  let data = req.body;

  const projectId = _.get(res, 'locals.projectId', null);

  //videoID must be defined
  let videoID = req.params.id;
  if (_.isUndefined(videoID) || videoID == '') {
    return next('undefined video ID');
  }

  query.patchVideo(videoID, data.data, projectId)
    .then(() => {
      if (_.isUndefined(data.data.relationships.playlists) || data.data.relationships.playlists.data.length == 0) {
        return Promise.resolve();
      }

      let playlistIDs = [];

      for (let pl of data.data.relationships.playlists.data) {
        playlistIDs.push(pl.id);
      }

      return new Promise((resolve, reject) => {
        query.insertPlaylistVideo(_.uniq(playlistIDs), videoID, projectId).then(() => {
          resolve();
        })
      })
    }).then(() => {
      // remove from redis
      client.delVideoById(videoID, projectId);
      client.delPlaylistIdsByVideoId(videoID, projectId);

      res.setHeader('content-type', 'application/vnd.api+json');
      res.json(data)
    }).catch(err => {
      return next(err);
    })
}

HandlerVideo.deleteVideo = (req, res, next) => {
  let videoID = req.params.id;

  const projectId = _.get(res, 'locals.projectId', null);

  query.deleteVideo(videoID, projectId).then(() => {
    // remove from redis
    client.delVideoById(videoID, projectId);
    client.delPlaylistIdsByVideoId(videoID, projectId);

    res.setHeader('content-type', 'application/vnd.api+json');
    res.json({ id: videoID, success: true })
  }).catch(err => {
    return next(err);
  })
}

HandlerVideo.getAllVideoQualities = (req, res, next) => {
  var data = util.newJSONAPIObject();

  const projectId = _.get(res, 'locals.projectId', null);

  // try get resource from redis
  client.getVideoQualities(projectId).then((result) => {
    return new Promise((resolve, reject) => {
      if (result != null) {
        resolve(result);
      } else {
        query.getAllVideoQualities(projectId).then((result) => {
          // add to redis
          client.setVideoQualities(result, ttl, projectId);
          resolve(result);
        });
      }
    });
  }).then((result) => {
    result.map((vq) => {
      let vqJSON = util.createVideoQualityJSON(vq);
      data.data.push(vqJSON);
    });

    res.setHeader('content-type', 'application/vnd.api+json');
    res.json(data)

  }).catch((err) => {
    return next(err);
  })
}

HandlerVideo.getSchedulesByDateAndPlaylistId = (req, res, next) => {
  let date = req.params.date;
  let playlistId = req.params.id;

  const projectId = _.get(res, 'locals.projectId', null);

  var data = util.newJSONAPIObject();

  // try get resource from redis
  client.getScheduleIdsByDateAndPlaylistId(date, playlistId, projectId).then((result) => {
    return new Promise((resolve, reject) => {
      if (result != null) {
        let getSchedules = [];
        let schedules = [];
        result.map((scheduleId) => {
          getSchedules.push(
            new Promise((resolve, reject) => {
              client.getScheduleById(scheduleId, projectId).then((result) => {
                if (result != null) {
                  schedules.push(result);
                  resolve();
                } else {
                  query.getSchedule(scheduleId, projectId).then((result) => {
                    if (result.length) {
                      schedules.push(result[0]);
                      client.setScheduleById(scheduleId, result[0], ttl, projectId);
                    }
                    resolve();
                  })
                }
              })
            })
          )
        })
        Promise.all(getSchedules).then(() => {
          resolve(schedules);
        })
      } else {
        // get from db
        query.getSchedulesByDateAndPlaylistId(date, playlistId, projectId).then((result) => {
          // add to redis
          let scheduleIds = [];
          result.map((schedule) => {
            scheduleIds.push(schedule.id);
          })
          client.setScheduleIdsByDateAndPlaylistId(date, playlistId, scheduleIds, ttl, projectId);
          resolve(result);
        });
      }
    })
  }).then((schedules) => {
    // for every schedule
    return schedules.map((schedule) => {
      return new Promise((resolve, reject) => {
        //create schedule json
        let result = util.createScheduleJSON(schedule);
        data.data.push(result);

        // include playlist
        let playlistId = result.relationships.playlist.data.id;
        let getPlaylist = new Promise((resolve, reject) => {
          client.getPlaylistById(playlistId, projectId).then((result) => {
            if (result != null) {
              if (result != 'undefined') {
                data.included.push(util.createPlaylistJSON(result));
              }
              resolve();
            } else {
              query.getPlaylistByID(playlistId, projectId).then((result) => {
                data.included.push(util.createPlaylistJSON(result[0]));
                client.setPlaylistById(playlistId, result[0], ttl, projectId);
                resolve();
              })
            }
          })
        })

        // include video
        let videoId = result.relationships.video ? result.relationships.video.data.id : null;
        let getVideo = new Promise((resolve, reject) => {
          if (videoId != null) {
            client.getVideoById(videoId, projectId).then((result) => {
              if (result != null) {
                data.included.push(util.createVideoJSON(result, 0, 0));
                resolve();
              } else {
                query.getVideo(videoId, projectId).then((result) => {
                  data.included.push(util.createVideoJSON(result[0], 0, 0));
                  client.setVideoById(videoId, result[0], ttl, projectId);
                  resolve();
                })
              }
            })
          } else {
            resolve();
          }
        })

        Promise.all([getPlaylist, getVideo]).then(() => {
          resolve();
        })
      })
    })
  }).then((promises) => {
    Promise.all(promises).then(() => {

      res.setHeader('content-type', 'application/vnd.api+json');
      res.json(data)
    })
  }).catch((err) => {
    return next(err);
  })
}

// Fira handler
HandlerVideo.getVideoFira = (req, res, next) => {
  let videoID = req.params.id;
  let firaID = req.params.fira_id;
  let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1;

  var data = util.newJSONAPIObject();
  var videoData = {};

  var getHomeTeam, getAwayTeam;

  // try get resource from redis
  client.getVideoById(videoID).then((result) => {
    return new Promise((resolve, reject) => {
      if (result != null) {
        // check video exist or not
        if (result == 'undefined') {
          return util.responseError(res, {
            message: 'No video found'
          }, 404);
        }
        resolve(result);
      } else {
        // get from db
        query.getVideo(videoID).then((result) => {
          //this should only yield 1 row
          //otherwise reject the promise
          if (result.length === 0) {
            // add to redis as not exist video
            client.setVideoById(videoID, 'undefined', ttl);

            return util.responseError(res, {
              message: 'No video found'
            }, 404);
          }
          // add to redis
          client.setVideoById(videoID, result[0], ttl);

          //if it somehow has multiple rows
          //only the first row matters
          resolve(result[0]);
        })
      }
    })
  }).then((result) => {
    return util.createVideoWithPlaylistJSON(result, useRelationships);
  })
    //get playlist and teams data to included
    .then((result) => {
      videoData = result;

      if (videoData.relationships && videoData.relationships.playlists) {
        let playlistIDS = [];
        for (let pl of videoData.relationships.playlists.data) {
          playlistIDS.push(pl.id)
        }

        return Promise.resolve(playlistIDS);
      } else {
        return Promise.resolve([]);
      }
    }).then((playlistIDS) => {
      let playlists = [];
      let getPlaylists = [];

      playlistIDS.map((playlistId) => {
        getPlaylists.push(
          new Promise((resolve, reject) => {
            client.getPlaylistById(playlistId).then((result) => {
              if (result != null) {
                if (result != 'undefined') {
                  playlists.push(result);
                }
                resolve();
              } else {
                query.getPlaylistByID(playlistId, projectId).then((result) => {
                  if (result.length) {
                    playlists.push(result[0]);
                    client.setPlaylistById(playlistId, result[0], ttl);
                  }
                  resolve();
                })
              }
            })
          })
        )
      })
      return new Promise((resolve, reject) => {
        Promise.all(getPlaylists).then((result) => {
          resolve(playlists);
        })
      })
    }).then((result = []) => {
      data.included = data.included.concat(result.map(pl => util.createPlaylistJSON(pl)))
    })
    //get home team data
    .then(() => {
      getHomeTeam = new Promise((resolve, reject) => {
        if (videoData.relationships && videoData.relationships.home) {
          let teamID = videoData.relationships.home.data.id;
          client.getTeamById(teamID).then((result) => {
            if (result != null) {
              data.included.push(util.createTeamJSON(result));
              resolve();
            } else {
              query.getTeamByID(teamID).then((homeTeam) => {
                data.included.push(util.createTeamJSON(homeTeam[0]));
                // add to redis
                client.setTeamById(teamID, homeTeam[0], ttl);
                resolve();
              });
            }
          })
        } else {
          resolve();
        }
      });
    })
    //get away team data
    .then(() => {
      getAwayTeam = new Promise((resolve, reject) => {
        if (videoData.relationships && videoData.relationships.away) {
          let teamID = videoData.relationships.away.data.id;
          client.getTeamById(teamID).then((result) => {
            if (result != null) {
              data.included.push(util.createTeamJSON(result));
              resolve();
            } else {
              query.getTeamByID(teamID).then((awayTeam) => {
                data.included.push(util.createTeamJSON(awayTeam[0]));
                // add to redis
                client.setTeamById(teamID, awayTeam[0], ttl);
                resolve();
              });
            }
          })
        } else {
          resolve();
        }
      })
    }).then(() => {
      // get related articles
      videoData.relationships = videoData.relationships || {};
      return new Promise((resolveArticle, rejectArticle) => {
        if (useRelationships) {
          videoData.relationships.article = { data: [] };
          // get related article IDs
          client.getRelatedArticleIds(videoID).then((result) => {
            return new Promise((resolve, reject) => {
              let articleIds = [];
              if (result != null) {
                result.map((articleId) => {
                  videoData.relationships.article.data.push({ type: 'article', id: articleId });
                  articleIds.push(articleId);
                })
                resolve(articleIds);
              } else {
                query.getRelatedArticles(videoID, projectId).then((result) => {

                  result.map((article) => {
                    videoData.relationships.article.data.push({ type: 'article', id: article.article_id });
                    articleIds.push(article.article_id);
                  })
                  client.setRelatedArticleIds(videoID, articleIds, ttl);
                  resolve(articleIds);
                })
              }
            });
          }).then((articleIds) => {
            // get every articles from articles-api
            let getArticles = [];
            if (useRelationships) { // prevent infinite loops with articles-api
              articleIds.map((articleId) => {
                getArticles.push(
                  new Promise((resolve, reject) => {
                    apiClient.service.article.getArticleById(articleId, { relationships: false }).then((result) => {
                      if (result != null) {
                        data.included.push(util.createArticleJSON(result));
                      }
                      resolve();
                    })
                  })
                )
              });
            }
            Promise.all(getArticles).then(() => {
              resolveArticle();
            })
          })
        } else {
          resolveArticle();
        }
      })
    }).then(() => {
      if (!useRelationships) {
        return Promise.resolve();
      }

      // get content type to be included
      let contentTypeId = videoData.attributes.type;
      return new Promise((resolve, reject) => {
        client.getContentTypeById(contentTypeId).then((result) => {
          if (result != null) {
            data.included.push(util.createContentTypeJSON(result));
            resolve();
          } else {
            query.getContentType(contentTypeId, projectId).then((result) => {
              data.included.push(util.createContentTypeJSON(result[0]));
              client.setContentTypeById(contentTypeId, result[0], ttl);
              resolve();
            })
          }
        })
      })
    }).then(() => {
      if (!useRelationships) {
        return Promise.resolve();
      }

      // authorize video and get token
      let userId = firaID;
      let clientIp = req.ip;
      let permission = videoData.attributes.permission;
      let source = videoData.attributes.source;
      let streamUrl = videoData.attributes.streamUrl;
      let contentTypeId = videoData.attributes.type;
      let playlistIds = [];
      videoData.relationships.playlists.data.map((playlist) => {
        playlistIds.push(playlist.id);
      })
      let isBypassed = true; // checked by scope for Fira users
      return new Promise((resolve, reject) => {
        if (userId != undefined) {
          const accessToken = req.headers['authorization'] ? req.headers['authorization'].split(' ')[1] : '';
          token.getVideoToken(userId, clientIp, videoID, permission, source, streamUrl, contentTypeId, playlistIds, accessToken, isBypassed, projectId).then((result) => {

            if (result.error != null) {
              // not authorized
              videoData.attributes.streamUrl = null;
              resolve();
            } else {
              videoData.attributes.streamUrl = result.streamUrl;
              resolve();
            }
          })
        } else {
          // not authorized
          videoData.attributes.streamUrl = null;
          resolve();
        }
      })
    }).then(() => {
      data.data.push(videoData);

      Promise.all([getHomeTeam, getAwayTeam]).then(() => {
        res.setHeader('content-type', 'application/vnd.api+json');
        res.json(data);
      })
    }).catch((err) => {
      return next(err);
    })

}


module.exports = HandlerVideo;
