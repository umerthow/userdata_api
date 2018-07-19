const config = require('config');
const query = require('./query.js');
const redis = require('./redis.js');

// redis client
const client = new redis(config.redis.port, config.redis.host);
const ttl = config.redis.ttl;

const Util = {};

Util.newJSONAPIObject = () => {
  return {
    type: 'video-history',
    data: []
  }
}

Util.createVidHistoryWithJSON = (vh, useRelationships, projectId) => {
  //console.log(vh);
  let videoData = Util.createHistoryJSON(vh, useRelationships, 1);
  let getHistory = [];
  //console.log(videoData);
  return Promise.resolve(videoData);


}

Util.createHistoryJSON = (his, useRelationships) => {
  console.log(his);
  let isFree;
  let id_ = 1;
  return {
    id: ++id_,
    uid: his.uid,
    attributes: {
      timePostition: his.time_position,
      updatedAt: his.updated_at.value,
      videoId: his.video_id,
    }


  }


}




Util.createVideoJSON = (vid, useRelationships, useStreamUrl) => {
  let videoData = {
    type: 'video',
    id: vid.id,
    attributes: {
      title: vid.title,
      description: vid.description,
      shortDescription: vid.short_description || null,
      fullDescription: vid.full_description || null,
      visibility: vid.visibility,
      permission: vid.permission,
      type: vid.content_type,
      language: vid.audio_language,
      subtitle: vid.subtitle_language,
      views: vid.views_count,
      likes: vid.likes_count,
      rating: Number(vid.rating),
      source: vid.source,
      url: vid.preview_url, // "`http://supersoccer.tv/video/watch?v=${vid.id}`", , // temporary - quick fix for polytron
      cover: vid.cover_url,
      background: vid.background_url || "",
      previews: [], // vid.preview_url ? vid.preview_url.split(",") : [], // temporary - quick fix for polytron
      trailer: vid.trailer_url ? vid.trailer_url.split(",") : ["previewUrl.1", "previewUrl.2", "previewUrl.3"],
      duration: vid.duration,
      start: vid.match_start,
      end: vid.match_end,
      displayOrder: vid.display_order,
      expireAt: vid.expire_at,
      createdAt: vid.created_at
    }
  };

  if (useStreamUrl) {
    videoData.attributes.streamUrl = vid.stream_source_url
  }

  if (vid.home_team_id && useRelationships) {
    videoData.relationships = videoData.relationships || {};
    videoData.relationships.home = {
      data: {
        type: 'team',
        id: vid.home_team_id
      }
    };
  }

  if (vid.away_team_id && useRelationships) {
    videoData.relationships = videoData.relationships || {};
    videoData.relationships.away = {
      data: {
        type: 'team',
        id: vid.away_team_id
      }
    };
  }

  return videoData;
}

//preference


//createVideoHistoryJSON

Util.createVideoHistoryWithJSON = (hs, useRelationships, projectId) => {
  let hsData = Util.createHistoryJSON(hs);
  if (useRelationships) {
    hsData.attributes.videos = [];
  } else { // no relationships needed
    hsData.relationships = {};
    return Promise.resolve(hsData);
  }

  return new Promise((resolve, reject) => {

    resolve(hsData);

  });

}



Util.createAdJSON = (ad) => {
  return {
    type: 'ad',
    id: ad.id,
    attributes: {
      position: ad.position,
      definitions: ad.definitions
    }
  }
}

Util.responseError = (res, err, statusCode) => {
  res.setHeader('content-type', 'application/vnd.api+json');
  res.status(statusCode);
  res.json({
    jsonapi: {
      version: config.api.version
    },
    errors: err
  });
}

module.exports = Util;
