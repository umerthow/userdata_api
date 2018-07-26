import { dbSeqVideo, dbSeqUser } from './sequelize.js'
import path from 'path'

export const DBUser = {
	// datatabse userdata
	Preferences: dbSeqUser.import(path.join(__dirname, '/model_userdata/preferences')),
	VideoFavorites: dbSeqUser.import(path.join(__dirname, '/model_userdata/video_favorites')),
	VideoHistory: dbSeqUser.import(path.join(__dirname, '/model_userdata/video_history')),
	CustomePlaylistDet: dbSeqUser.import(path.join(__dirname, '/model_userdata/custom_playlists_details')),
	CustomePlaylistVid: dbSeqUser.import(path.join(__dirname, '/model_userdata/custom_playlists_videos'))
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
	Videos: dbSeqVideo.import(path.join(__dirname, '/model_video/videos'))
}
