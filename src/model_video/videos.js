/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('videos', {
    id: {
      type: DataTypes.CHAR(10),
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.CHAR(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    short_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    full_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    home_team_id: {
      type: DataTypes.INTEGER(8).UNSIGNED,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    away_team_id: {
      type: DataTypes.INTEGER(8).UNSIGNED,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    visibility: {
      type: DataTypes.INTEGER(8).UNSIGNED,
      allowNull: false,
      defaultValue: '0'
    },
    permission: {
      type: DataTypes.INTEGER(8).UNSIGNED,
      allowNull: false,
      defaultValue: '1'
    },
    content_type: {
      type: DataTypes.INTEGER(8).UNSIGNED,
      allowNull: false,
      references: {
        model: 'content_types',
        key: 'id'
      }
    },
    audio_language: {
      type: DataTypes.CHAR(2),
      allowNull: true
    },
    subtitle_language: {
      type: DataTypes.CHAR(2),
      allowNull: true
    },
    views_count: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: true
    },
    likes_count: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: true
    },
    source: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    stream_source_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    cover_url: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    preview_url: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    thumbnail: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    duration: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    match_start: {
      type: DataTypes.DATE,
      allowNull: true
    },
    match_end: {
      type: DataTypes.DATE,
      allowNull: true
    },
    display_order: {
      type: DataTypes.INTEGER(8).UNSIGNED,
      allowNull: true
    },
    players: {
      type: DataTypes.STRING(2000),
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '1'
    },
    expire_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    chapter: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    drm: {
      type: DataTypes.INTEGER(1),
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    project_id: {
      type: DataTypes.CHAR(20),
      allowNull: true
    },
    rating: {
      type: DataTypes.DECIMAL,
      allowNull: true
    }
  }, {
    tableName: 'videos',
    timestamps: true,
    paranoid: true,
    underscored: true
  });
};
