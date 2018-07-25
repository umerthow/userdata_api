// const DBModel = require('./model.js');
import { DBModel, DBUser } from './model.js'
const Sequelize = require('sequelize')

const moment = require('moment')

// modify update key with db column name
// not all key should be converted
const convertJSONKey = (key) => {
	switch (key) {
	case 'homeTeamID':
		return 'home_team_id'
	case 'awayTeamID':
		return 'away_team_id'
	case 'visibility':
		return 'visibility'
	case 'contentType':
		return 'content_type'
	case 'audioLanguage':
		return 'audio_language'
	case 'subtitleLanguage':
		return 'subtitle_language'
	case 'streamSourceURL':
		return 'stream_source_url'
	case 'coverURL':
		return 'cover_url'
	case 'previewURL':
		return 'preview_url'
	case 'matchStart':
		return 'match_start'
	case 'matchEnd':
		return 'match_end'
	case 'displayOrder':
		return 'display_order'
	case 'expireAt':
		return 'expire_at'
	case 'countryCode':
		return 'country_code'
	case 'iconURL':
		return 'icon_url'
	case 'sortOrder':
		return 'sort_order'
	case 'parentID':
		return 'parent_id'
	default:
		return key
	}
}

const Query = {}

/// ////////////////////
/// /// VIDEOS ////////
/// //////////////////
Query.getVideo = (videoID, projectId) => {
	return DBModel.Videos.findAll({
		where: {
			id: videoID,
			status: 1,
			project_id: projectId
		},
		attributes: [
			'id',
			'title',
			'description',
			'short_description',
			'full_description',
			'home_team_id',
			'away_team_id',
			'visibility',
			'permission',
			'content_type',
			'audio_language',
			'subtitle_language',
			'views_count',
			'likes_count',
			'rating',
			'source',
			'stream_source_url',
			'cover_url',
			'preview_url',
			'duration',
			'match_start',
			'match_end',
			'display_order',
			'expire_at',
			'created_at'
		]
	})
}

Query.getVideos = (videoIDs) => {
	return DBModel.Videos.findAll({
		where: {
			id: {
				$in: videoIDs
			},
			status: 1
		},
		attributes: [
			'id',
			'title',
			'description',
			'short_description',
			'full_description',
			'home_team_id',
			'away_team_id',
			'visibility',
			'permission',
			'content_type',
			'audio_language',
			'subtitle_language',
			'views_count',
			'likes_count',
			'source',
			'stream_source_url',
			'cover_url',
			'preview_url',
			'duration',
			'match_start',
			'match_end',
			'display_order',
			'expire_at',
			'created_at'
		]
	})
}

Query.getVideosByDateAndContentType = (date, contentType, projectId) => {
	let dateStart = moment(date, 'YYYYMMDD')
	let dateEnd = moment(date, 'YYYYMMDD').add(1, 'day')

	return DBModel.Videos.findAll({
		where: {
			status: 1,
			match_start: {
				$gte: dateStart,
				$lt: dateEnd
			},
			project_id: projectId
		},
		attributes: [
			'id',
			'title',
			'description',
			'short_description',
			'full_description',
			'home_team_id',
			'away_team_id',
			'visibility',
			'permission',
			'content_type',
			'audio_language',
			'subtitle_language',
			'views_count',
			'likes_count',
			'source',
			'stream_source_url',
			'cover_url',
			'preview_url',
			'duration',
			'match_start',
			'match_end',
			'expire_at',
			'created_at'
		],
		include: [
			{
				model: DBModel.ContentTypes,
				as: 'content_types',
				required: true,
				where: {
					name: contentType
				}
			}
		]
	})
}

Query.insertVideo = (vid, projectId) => {
	// modify dates value
	let matchStart = moment(vid.attributes.matchStart, 'YYYYMMDD hh:mm:ss')
	let matchEnd = moment(vid.attributes.matchEnd, 'YYYYMMDD hh:mm:ss')
	let expireAt = moment(vid.attributes.expireAt, 'YYYYMMDD hh:mm:ss')

	return DBModel.Videos.create({
		id: vid.id,
		title: vid.attributes.title,
		description: vid.attributes.description,
		short_description: vid.attributes.shortDescription,
		full_description: vid.attributes.fullDescription,
		home_team_id: vid.relationships.home.data.id,
		away_team_id: vid.relationships.away.data.id,
		visibility: vid.attributes.visibility,
		content_type: vid.attributes.contentType,
		audio_language: vid.attributes.audioLanguage,
		subtitle_language: vid.attributes.subtitleLanguage,
		views_count: 0,
		likes_count: 0,
		stream_source_url: vid.attributes.streamSourceURL,
		cover_url: vid.attributes.coverURL,
		preview_url: vid.attributes.previewURL,
		duration: vid.attributes.duration,
		match_start: matchStart,
		match_end: matchEnd,
		status: 1,
		expire_at: expireAt,
		project_id: projectId
	})
}

Query.updateVideo = (vid, projectId) => {
	// modify dates value
	let matchStart = moment(vid.attributes.matchStart, 'YYYYMMDD hh:mm:ss')
	let matchEnd = moment(vid.attributes.matchEnd, 'YYYYMMDD hh:mm:ss')
	let expireAt = moment(vid.attributes.expireAt, 'YYYYMMDD hh:mm:ss')

	return DBModel.Videos.update({
		title: vid.attributes.title,
		description: vid.attributes.description,
		short_description: vid.attributes.shortDescription,
		full_description: vid.attributes.fullDescription,
		home_team_id: vid.relationships.home.data.id,
		away_team_id: vid.relationships.away.data.id,
		visibility: vid.attributes.visibility,
		content_type: vid.attributes.contentType,
		audio_language: vid.attributes.audioLanguage,
		subtitle_language: vid.attributes.subtitleLanguage,
		stream_source_url: vid.attributes.streamSourceURL,
		cover_url: vid.attributes.coverURL,
		preview_url: vid.attributes.previewURL,
		duration: vid.attributes.duration,
		match_start: matchStart,
		match_end: matchEnd,
		expire_at: expireAt
	}, {
		where: {
			id: vid.id,
			project_id: projectId
		}
	})
}

Query.patchVideo = (videoID, vid, projectId) => {
	// create update json based on patch body
	let queryData = {}

	let attributes = vid.attributes || {}
	let relationships = vid.relationships || {}

	for (let key in attributes) {
		let val = attributes[key]
		if (key === 'matchStart' || key === 'matchEnd' || key === 'expireAt') {
			val = moment(val, 'YYYYMMDD hh:mm:ss')
		}
		queryData[convertJSONKey(key)] = val
	}

	for (let key in relationships) {
		if (key === 'home') {
			queryData['home_team_id'] = relationships.home.data.id
		} else if (key === 'away') {
			queryData['away_team_id'] = relationships.away.data.id
		}
	}

	return DBModel.Videos.update({
		title: queryData.attributes.title,
		description: queryData.attributes.description,
		short_description: vid.attributes.shortDescription,
		full_description: vid.attributes.fullDescription,
		home_team_id: queryData.relationships.home.data.id,
		away_team_id: queryData.relationships.away.data.id,
		visibility: queryData.attributes.visibility,
		content_type: queryData.attributes.contentType,
		audio_language: queryData.attributes.audioLanguage,
		subtitle_language: queryData.attributes.subtitleLanguage,
		stream_source_url: queryData.attributes.streamSourceURL,
		cover_url: queryData.attributes.coverURL,
		preview_url: queryData.attributes.previewURL,
		duration: queryData.attributes.duration,
		match_start: queryData.attributes.matchStart,
		match_end: queryData.attributes.matchEnd,
		expire_at: queryData.attributes.expireAt
	}, {
		where: {
			id: videoID,
			project_id: projectId
		}
	})
}

Query.deleteVideo = (videoID, projectId) => {
	return DBModel.Videos.update({
		status: 0,
		deleted_at: Sequelize.literal('CURRENT_TIMESTAMP')
	}, {
		where: {
			id: videoID,
			project_id: projectId
		}
	})
}

/// ////////////////////
/// // PREFERENCES ////
/// /////////////////

Query.getPreferenceByIDs = (id, projectId) => {
	return DBUser.Preferences.findAll({
		where: {
			uid: id
		},
		attributes: [
			'id',
			'uid',
			'created_at',
			'updated_at',
			'language'
		]
	})
}

Query.insertPreference = (pf, projectId) => {
	// modify dates value
	let createdAt = moment().format('YYYY-MM-DD HH:mm:SS')
	return DBUser.Preferences.create({
		uid: pf.uid,
		langguage: pf.langguage,
		created_at: createdAt

		// project_id: projectId
	})
}

Query.UpdatePreference = (pf, projectId) => {
	let updatedAt = moment().format('YYYY-MM-DD HH:mm:SS')
	return DBUser.Preferences.update({
		language: pf.language,
		updated_at: updatedAt
	}, {
		where: {
			uid: pf.uid,
			id: pf.id
			//       project_id: projectId
		}
	})
}

Query.deletePreference = (preferenceID, projectId) => {
	return DBUser.Preferences.update({
		status: 0,
		deleted_at: Sequelize.literal('CURRENT_TIMESTAMP')
	}, {
		where: {
			id: preferenceID
			//       project_id: projectId
		}
	})
}

/// ////////////////////
/// VIDEO FAVORITES ////
/// ///////////////////

Query.getFavoritesByIDs = (id, projectId) => {
	return DBUser.VideoFavorites.findAll({
		where: {
			uid: id
		},
		attributes: {
			exclude: ['deleted_at']
		},
		raw: true
	}).then(result => result)
}

Query.insertFavorites = (fv, projectId) => {
	// modify dates value

	return DBUser.VideoFavorites.create({
		uid: fv.uid,
		video_id: fv.videoId

		// project_id: projectId
	})
}

Query.UpdateFavorites = (fv, projectId) => {
	let updatedAt = moment().format('YYYY-MM-DD HH:mm:SS')
	return DBUser.VideoFavorites.update({
		video_id: fv.videoId,
		updated_at: updatedAt
	}, {
		where: {
			uid: fv.uid,
			id: fv.id
			//       project_id: projectId
		}
	})
}

Query.deleteFavorites = (fv, projectId) => {
	return DBUser.VideoFavorites.update({
		deleted_at: Sequelize.literal('CURRENT_TIMESTAMP')
	}, {
		where: {
			uid: fv.uid,
			id: fv.id
			//       project_id: projectId
		}
	})
}

/// ///////////////////////
/// CUSTOM PLAYLISTS /////
/// /////////////////////
Query.insertCustPlaylist = () => {

}
/// ////////////////////
/// /// PLAYLISTS /////
/// //////////////////

Query.getAllPlaylists = (projectId) => {
	return DBModel.Playlists.findAll({
		where: {
			status: 1,
			project_id: projectId
		},
		attributes: [
			'id',
			'title',
			'description',
			'short_description',
			'full_description',
			'visibility',
			'content_type',
			'country_code',
			'cover_url',
			'icon_url',
			'sort_order',
			'parent_id',
			'created_at'
		]
	})
}

Query.getPlaylistsByIDs = (ids, projectId) => {
	return DBModel.Playlists.findAll({
		where: {
			id: {
				$in: ids
			},
			status: 1,
			project_id: projectId
		},
		attributes: [
			'id',
			'title',
			'description',
			'visibility',
			'content_type',
			'country_code',
			'cover_url',
			'icon_url',
			'sort_order',
			'parent_id',
			'created_at'
		]
	})
}

Query.getPlaylistByID = (id, projectId) => {
	return DBModel.Playlists.findAll({
		where: {
			id: id,
			status: 1,
			project_id: projectId
		},
		attributes: [
			'id',
			'title',
			'description',
			'visibility',
			'content_type',
			'country_code',
			'cover_url',
			'icon_url',
			'sort_order',
			'parent_id',
			'created_at'
		]
	})
}

Query.getPlaylistsByContentType = (contentType, projectId) => {
	return DBModel.Playlists.findAll({
		where: {
			status: 1,
			project_id: projectId
		},
		attributes: [
			'id',
			'title',
			'description',
			'visibility',
			'content_type',
			'country_code',
			'cover_url',
			'icon_url',
			'sort_order',
			'parent_id',
			'created_at'
		],
		include: [
			{
				model: DBModel.ContentTypes,
				as: 'content_types',
				required: true,
				where: {
					name: contentType
				}
			}
		]
	})
}

Query.getSubplaylists = (id, projectId) => {
	return DBModel.Playlists.findAll({
		where: {
			parent_id: {
				$like: id + '%'
			},
			status: 1,
			project_id: projectId
		},
		attributes: [
			'id'
		]
	})
}

Query.insertPlaylist = (pl, projectId) => {
	return DBModel.Playlists.create({
		id: pl.id,
		title: pl.attributes.title,
		description: pl.attributes.description,
		visibility: pl.attributes.visibility,
		content_type: pl.attributes.contentType,
		country_code: pl.attributes.countryCode,
		cover_url: pl.attributes.coverURL,
		icon_url: pl.attributes.iconURL,
		sort_order: pl.attributes.sortOrder,
		parent_id: pl.attributes.parentID,
		status: 1,
		project_id: projectId
	})
}

Query.updatePlaylist = (pl, projectId) => {
	return DBModel.Playlists.update({
		title: pl.attributes.title,
		description: pl.attributes.description,
		visibility: pl.attributes.visibility,
		content_type: pl.attributes.contentType,
		country_code: pl.attributes.countryCode,
		cover_url: pl.attributes.coverURL,
		icon_url: pl.attributes.iconURL,
		sort_order: pl.attributes.sortOrder,
		parent_id: pl.attributes.parentID
	}, {
		where: {
			id: pl.id,
			project_id: projectId
		}
	})
}

Query.patchPlaylist = (plID, pl, projectId) => {
	// create update json based on patch body
	let queryData = {}

	for (let key in pl) {
		queryData[convertJSONKey(key)] = pl[key]
	}

	return DBModel.Playlists.update({
		title: pl.attributes.title,
		description: pl.attributes.description,
		visibility: pl.attributes.visibility,
		content_type: pl.attributes.contentType,
		country_code: pl.attributes.countryCode,
		cover_url: pl.attributes.coverURL,
		icon_url: pl.attributes.iconURL,
		sort_order: pl.attributes.sortOrder,
		parent_id: pl.attributes.parentID
	}, {
		where: {
			id: plID,
			project_id: projectId
		}
	})
}

Query.deletePlaylist = (playlistID, projectId) => {
	return DBModel.Playlists.update({
		status: 0,
		deleted_at: Sequelize.literal('CURRENT_TIMESTAMP')
	}, {
		where: {
			id: playlistID,
			project_id: projectId
		}
	})
}

/// ////////////////////
/// /PLAYLIST VIDEO////
/// //////////////////

Query.getPlaylistsByVideoID = (videoID, projectId) => {
	return DBModel.PlaylistVideos.findAll({
		where: {
			video_id: videoID,
			status: 1,
			project_id: projectId
		},
		attributes: ['playlist_id']
	})
}

Query.getVideosByPlaylistID = (playlistID, projectId) => {
	return DBModel.PlaylistVideos.findAll({
		where: {
			playlist_id: playlistID,
			status: 1,
			project_id: projectId
		},
		attributes: ['video_id']
	})
}

Query.insertPlaylistVideo = (playlistIDs, videoID, projectId) => {
	let bulkCreateData = []
	for (let pl of playlistIDs) {
		bulkCreateData.push({ playlist_id: pl, video_id: videoID, status: 1, project_id: projectId })
	};

	return DBModel.PlaylistVideos.bulkCreate(bulkCreateData)
}

/// ////////////////////
/// ///// TEAMS ///////
/// //////////////////

Query.getTeamByID = (teamID) => {
	return DBModel.Teams.findAll({
		where: {
			id: teamID,
			status: 1
		},
		attributes: ['id', 'name', 'official_website_url', 'home', 'logo']
	})
}

Query.getTeamByIDs = (teamIDs) => {
	return DBModel.Teams.findAll({
		where: {
			id: {
				$in: teamIDs
			},
			status: 1
		},
		attributes: ['id', 'name', 'official_website_url', 'home', 'logo']
	})
}

/// ////////////////////
/// ///// CONTENT TYPES ///////
/// //////////////////
Query.getContentType = (id) => {
	return DBModel.ContentTypes.findAll({
		where: {
			id: id,
			deleted_at: null
		},
		attributes: ['id', 'name']
	})
}

/// ////////////////////
/// /// VIDEO QUALITIES /////
/// //////////////////

Query.getVideoQuality = (id) => {
	return DBModel.VideoQualities.findAll({
		where: {
			id: id
		},
		attributes: [
			'id',
			'title',
			'bitrate',
			'width',
			'height',
			'priority'
		],
		raw: true
	})
}

Query.getAllVideoQualities = (projectId) => {
	return DBModel.VideoQualities.findAll({
		where: {
			project_id: projectId
		},
		attributes: [
			'id',
			'title',
			'bitrate',
			'width',
			'height',
			'priority'
		]
	})
}

/// ////////////////////
/// ///// RELATED ARTICLES ///////
/// //////////////////

Query.getRelatedArticles = (videoID) => {
	return DBModel.RelatedArticles.findAll({
		where: {
			video_id: videoID,
			status: 1
		},
		attributes: ['article_id']
	})
}

Query.insertRelatedArticles = (articleIds, videoId) => {
	let bulkCreateData = []
	for (let articleId of articleIds) {
		bulkCreateData.push({ video_id: videoId, article_id: articleId, status: 1 })
	};

	return DBModel.RelatedArticles.bulkCreate(bulkCreateData)
}

/// ////////////////////
/// ///// SCHEDULES ///////
/// //////////////////

Query.getSchedule = (id, projectId) => {
	return DBModel.Schedules.findAll({
		where: {
			id: id,
			deleted_at: null,
			project_id: projectId
		},
		attributes: [
			'id',
			'title',
			'start',
			'end',
			'playlist_id',
			'video_id',
			'description',
			'created_at'
		]
	})
}

Query.getSchedulesByDateAndPlaylistId = (date, playlistId, projectId) => {
	let dateStart = moment(date, 'YYYYMMDD')
	let dateEnd = moment(date, 'YYYYMMDD').add(1, 'day')

	return DBModel.Schedules.findAll({
		where: {
			playlist_id: playlistId,
			start: {
				$gte: dateStart,
				$lt: dateEnd
			},
			deleted_at: null,
			project_id: projectId
		},
		attributes: [
			'id',
			'title',
			'start',
			'end',
			'playlist_id',
			'video_id',
			'description',
			'created_at'
		]
	})
}

/// ////////////////////
/// ///// VIDEO ADS ///////
/// //////////////////

Query.getAds = (projectId) => {
	return DBModel.VideoAds.findAll({
		where: {
			status: 1
		},
		attributes: [
			'id'
		]
	})
}

Query.getAdById = (id, projectId) => {
	return DBModel.VideoAds.findOne({
		where: {
			id: id,
			status: 1
		},
		attributes: [
			'id',
			'title',
			'url',
			'duration',
			'type',
			'skip_offset',
			'bitrate',
			'width',
			'height',
			'status'
		]
	})
}

module.exports = Query
