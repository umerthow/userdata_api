const Sequelize = require('sequelize');
const dbConf = require('./sequelize.js');

const DBModel = {};

DBModel.Videos = dbConf.define('videos', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    field: 'id'
  },
  title: {
    type: Sequelize.STRING,
    field: 'title'
  },
  description: {
    type: Sequelize.STRING,
    field: 'description'
  },
  shortDescription: {
    type: Sequelize.TEXT,
    field: 'short_description'
  },
  fullDescription: {
    type: Sequelize.TEXT,
    field: 'full_description'
  },
  home_team_id: {
    type: Sequelize.INTEGER,
    field: 'home_team_id'
  },
  away_team_id: {
    type: Sequelize.INTEGER,
    field: 'away_team_id'
  },
  visibility: {
    type: Sequelize.INTEGER,
    field: 'visibility'
  },
  permission: {
    type: Sequelize.INTEGER,
    field: 'permission'
  },
  content_type: {
    type: Sequelize.INTEGER,
    field: 'content_type'
  },
  audio_language: {
    type: Sequelize.STRING,
    field: 'audio_language'
  },
  subtitle_language: {
    type: Sequelize.STRING,
    field: 'subtitle_language'
  },
  views_count: {
    type: Sequelize.INTEGER,
    field: 'views_count'
  },
  likes_count: {
    type: Sequelize.INTEGER,
    field: 'likes_count'
  },
  source: {
    type: Sequelize.STRING,
    field: 'source'
  },
  stream_source_url: {
    type: Sequelize.STRING,
    field: 'stream_source_url'
  },
  cover_url: {
    type: Sequelize.STRING,
    field: 'cover_url'
  },
  preview_url: {
    type: Sequelize.STRING,
    field: 'preview_url'
  },
  duration: {
    type: Sequelize.INTEGER,
    field: 'duration'
  },
  match_start: {
    type: Sequelize.DATE,
    field: 'match_start'
  },
  match_end: {
    type: Sequelize.DATE,
    field: 'match_end'
  },
  display_order: {
    type: Sequelize.INTEGER,
    field: 'display_order'
  },
  status: {
    type: Sequelize.INTEGER,
    field: 'status'
  },
  project_id: {
    type: Sequelize.STRING,
    field: 'project_id'
  },
  rating: {
    type: Sequelize.DOUBLE,
    field: 'rating'
  },
  expire_at: {
    type: Sequelize.DATE,
    field: 'expire_at'
  },
  deleted_at: {
    type: Sequelize.DATE,
    field: 'deleted_at'
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'videos'
});

DBModel.Playlists = dbConf.define('playlists', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    field: 'id'
  },
  title: {
    type: Sequelize.STRING,
    field: 'title'
  },
  description: {
    type: Sequelize.STRING,
    field: 'description'
  },
  visibility: {
    type: Sequelize.INTEGER,
    field: 'visibility'
  },
  content_type: {
    type: Sequelize.INTEGER,
    field: 'content_type'
  },
  country_code: {
    type: Sequelize.STRING,
    field: 'country_code'
  },
  cover_url: {
    type: Sequelize.STRING,
    field: 'cover_url'
  },
  icon_url: {
    type: Sequelize.STRING,
    field: 'icon_url'
  },
  sort_order: {
    type: Sequelize.INTEGER,
    field: 'sort_order'
  },
  parent_id: {
    type: Sequelize.STRING,
    field: 'parent_id'
  },
  status: {
    type: Sequelize.INTEGER,
    field: 'status'
  },
  project_id: {
    type: Sequelize.STRING,
    field: 'project_id'
  },
  deleted_at: {
    type: Sequelize.DATE,
    field: 'deleted_at'
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'playlists'
});

DBModel.PlaylistVideos = dbConf.define('playlist_videos', {
  playlist_id: {
    type: Sequelize.STRING,
    primaryKey: true,
    field: 'playlist_id'
  },
  video_id: {
    type: Sequelize.STRING,
    primaryKey: true,
    field: 'video_id'
  },
  status: {
    type: Sequelize.INTEGER,
    field: 'status'
  },
  project_id: {
    type: Sequelize.STRING,
    field: 'project_id'
  },
  deleted_at: {
    type: Sequelize.DATE,
    field: 'deleted_at'
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'playlist_videos'
});

DBModel.Teams = dbConf.define('teams', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    field: 'id'
  },
  name: {
    type: Sequelize.STRING,
    field: 'name'
  },
  official_website_url: {
    type: Sequelize.STRING,
    field: 'official_website_url'
  },
  home: {
    type: Sequelize.STRING,
    field: 'home'
  },
  logo: {
    type: Sequelize.STRING,
    field: 'logo'
  },
  status: {
    type: Sequelize.INTEGER,
    field: 'status'
  }
}, {
  timestamps: false,
  tableName: 'teams'
})

DBModel.ContentTypes = dbConf.define('content_types', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    field: 'id'
  },
  name: {
    type: Sequelize.STRING,
    field: 'name'
  },
  deleted_at: {
    type: Sequelize.DATE,
    field: 'deleted_at'
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'content_types'
})

DBModel.VideoQualities = dbConf.define('video_qualities', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    field: 'id'
  },
  title: {
    type: Sequelize.STRING,
    field: 'title'
  },
  bitrate: {
    type: Sequelize.STRING,
    field: 'bitrate'
  },
  width: {
    type: Sequelize.INTEGER,
    field: 'width'
  },
  height: {
    type: Sequelize.INTEGER,
    field: 'height'
  },
  deleted_at: {
    type: Sequelize.DATE,
    field: 'deleted_at'
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'video_qualities'
})

DBModel.RelatedArticles = dbConf.define('related_articles', {
  video_id: {
    type: Sequelize.STRING,
    primaryKey: true,
    field: 'video_id'
  },
  article_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    field: 'article_id'
  },
  status: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    field: 'status'
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'related_articles'
})

DBModel.Schedules = dbConf.define('schedules', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    field: 'id'
  },
  title: {
    type: Sequelize.STRING,
    field: 'title'
  },
  start: {
    type: Sequelize.DATE,
    field: 'start'
  },
  end: {
    type: Sequelize.DATE,
    field: 'end'
  },
  playlist_id: {
    type: Sequelize.STRING,
    field: 'playlist_id'
  },
  video_id: {
    type: Sequelize.STRING,
    field: 'video_id'
  },
  description: {
    type: Sequelize.STRING,
    field: 'description'
  },
  project_id: {
    type: Sequelize.STRING,
    field: 'project_id'
  },
  deleted_at: {
    type: Sequelize.DATE,
    field: 'deleted_at'
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'schedules'
})

DBModel.VideoAds = dbConf.define('video_ads', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    field: 'id'
  },
  title: {
    type: Sequelize.STRING,
    field: 'title'
  },
  url: {
    type: Sequelize.STRING,
    field: 'url'
  },
  duration: {
    type: Sequelize.STRING,
    field: 'duration'
  },
  skip_offset: {
    type: Sequelize.STRING,
    field: 'skip_offset'
  },
  type: {
    type: Sequelize.STRING,
    field: 'type'
  },
  bitrate: {
    type: Sequelize.STRING,
    field: 'bitrate'
  },
  width: {
    type: Sequelize.INTEGER,
    field: 'width'
  },
  height: {
    type: Sequelize.INTEGER,
    field: 'height'
  },
  project_id: {
    type: Sequelize.STRING,
    field: 'project_id'
  },
  status: {
    type: Sequelize.INTEGER,
    field: 'status'
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'video_ads'
})

DBModel.Playlists.belongsTo(DBModel.ContentTypes, {
  as: 'content_types',
  foreignKey: 'content_type'
});

DBModel.Videos.belongsTo(DBModel.ContentTypes, {
  as: 'content_types',
  foreignKey: 'content_type'
});

module.exports = DBModel;
