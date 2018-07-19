const DataTypes = require("sequelize");
import { dbSeq_video, dbSeq_user } from './sequelize.js'

export const DBUser = {
  // datatabse userdata
  Preferences: dbSeq_user.import(__dirname + "/model_userdata/preferences"),
  VideoFavorites: dbSeq_user.import(__dirname + "/model_userdata/video_favorites"),
  VideoHistory: dbSeq_user.import(__dirname + "/model_userdata/video_history"),

}

export const DBModel = {
  // database video
  // AppPermissions: dBannersbSeq_video.import(__dirname + "/model_video/app_permissions"),
  // BannerPositions: dbSeq_video.import(__dirname + "/model_video/banner_positions"),
  // Banners: dbSeq_video.import(__dirname + "/model_video/banners"),
  // ContentTypes: dbSeq_video.import(__dirname + "/model_video/content_types"),
  // logs: dbSeq_video.import(__dirname + "/model_video/logs"),
  // Playlist: dbSeq_video.import(__dirname + "/model_video/playlist"),
  // PlaylistVideos: dbSeq_video.import(__dirname + "/model_video/playlist_videos"),
  // RelatedArticles: dbSeq_video.import(__dirname + "/model_video/related_articles"),
  // Schedules: dbSeq_video.import(__dirname + "/model_video/schedules"),
  // Teams: dbSeq_video.import(__dirname + "/model_video/teams"),
  // VideoAds: dbSeq_video.import(__dirname + "/model_video/video_ads"),
  // VideoQualities: dbSeq_video.import(__dirname + "/model_video/video_qualities"),
  Videos: dbSeq_video.import(__dirname + "/model_video/videos")
}