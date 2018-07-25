import _ from 'lodash'
const config = require('config')
const query = require('./query.js')
const Redis = require('./redis.js')

// redis client
const client = new Redis(config.redis.port, config.redis.host)
const ttl = config.redis.ttl

const Util = {}

Util.newJSONAPIObject = () => {
	return {
		data: []
	}
}

Util.createVidHistoryWithJSON = (vh, useRelationships, projectId) => {
	// console.log(vh);
	let videoData = Util.createHistoryJSON(vh, useRelationships, 1)
	// console.log(videoData);
	return Promise.resolve(videoData)
}

Util.createPreferenceJSON = (pf, useRelationships) => {
	return {
		type: 'user-preference',
		id: pf.id,
		attributes: {
			uid: pf.uid,
			language: pf.language,
			createdAt: pf.created_at,
			updatedAt: pf.updated_at

		}

	}
}

Util.createFavoriteJSON = (fvs, useRelationships) => {
	return {
		type: 'user-video-favorites',
		id: fvs.id,
		attributes: {
			uid: fvs.uid,
			updatedAt: fvs.updated_at,
			videoId: fvs.video_id

		}

	}
}

Util.createHistoryJSON = (his, useRelationships) => {
	let id_ = 1
	return {
		type: 'user-video-history',
		id: ++id_,
		attributes: {
			uid: his.uid,
			timePostition: his.time_position,
			updatedAt: his.updated_at.value,
			videoId: his.video_id

		}

	}
}

Util.createPlaylistJSON = (pl) => {
	let isFree
	if (pl.id === config.playlist.free) {
		isFree = true
	} else {
		isFree = pl.parent_id != null ? pl.parent_id.split(' ').indexOf(config.playlist.free) >= 0 : false
	}

	return {
		type: 'playlist',
		id: pl.id,
		attributes: {
			name: pl.title,
			description: pl.description,
			visibility: pl.visibility,
			type: pl.content_type,
			country: pl.country_code,
			cover: pl.cover_url,
			icon: pl.icon_url,
			order: pl.sort_order,
			isFree: isFree,
			parentId: pl.parent_id,
			createdAt: pl.created_at
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
			contentType: vid.content_type,
			audioLanguage: vid.audio_language,
			subtitleLanguage: vid.subtitle_language,
			viewsCount: vid.views_count,
			likesCount: vid.likes_count,
			rating: Number(vid.rating),
			source: vid.source,
			previewUrl: vid.preview_url, // "`http://supersoccer.tv/video/watch?v=${vid.id}`", , // temporary - quick fix for polytron
			coverUrl: vid.cover_url,
			backgroundUrl: vid.background_url || '',
			previews: [], // vid.preview_url ? vid.preview_url.split(",") : [], // temporary - quick fix for polytron
			trailerUrl: vid.trailer_url ? vid.trailer_url.split(',') : ['previewUrl.1', 'previewUrl.2', 'previewUrl.3'],
			duration: vid.duration,
			matchStart: vid.match_start,
			matchEnd: vid.match_end,
			displayOrder: vid.display_order,
			expireAt: vid.expire_at,
			createdAt: vid.created_at
		}
	}

	if (useStreamUrl) {
		videoData.attributes.streamUrl = vid.stream_source_url
	}

	if (vid.home_team_id && useRelationships) {
		videoData.relationships = videoData.relationships || {}
		videoData.relationships.home = {
			data: {
				type: 'team',
				id: vid.home_team_id
			}
		}
	}

	if (vid.away_team_id && useRelationships) {
		videoData.relationships = videoData.relationships || {}
		videoData.relationships.away = {
			data: {
				type: 'team',
				id: vid.away_team_id
			}
		}
	}

	return videoData
}

Util.createVideoWithPlaylistJSON = (vid, useRelationships, projectId) => {
	let videoData = Util.createVideoJSON(vid, useRelationships, 1)
	let insertPlaylist = (result) => {
		videoData.relationships = videoData.relationships || {}
		videoData.relationships.playlists = {
			data: []
		}
		for (let pl of result) {
			videoData.relationships.playlists.data.push({ type: 'playlist', id: pl.id || pl.playlist_id })
		}
	}

	return new Promise((resolve, reject) => {
		if (useRelationships) {
			client.getPlaylistIdsByVideoId(vid.id, projectId).then((result) => {
				if (result != null) {
					let playlists = []
					let getPlaylists = []
					// get every playlist
					result.map((playlistId) => {
						getPlaylists.push(
							new Promise((resolve, reject) => {
								client.getPlaylistById(playlistId, projectId).then((result) => {
									if (result != null) {
										if (result !== 'undefined') {
											playlists.push(result)
										}
										resolve()
									} else {
										query.getPlaylistByID(playlistId, projectId).then((result) => {
											if (result.length) {
												playlists.push(result[0])
												client.setPlaylistById(playlistId, result[0], ttl, projectId)
											} else {
												// playlist not found, invalidate playlist IDs
												client.delPlaylistIdsByVideoId(vid.id, projectId)
											}
											resolve()
										})
									}
								})
							})
						)
					})
					Promise.all(getPlaylists).then(() => {
						insertPlaylist(playlists)
						resolve(videoData)
					})
				} else {
					query.getPlaylistsByVideoID(vid.id, projectId).then((result) => {
						insertPlaylist(result)
						// add to redis
						let playlistIds = []
						result.map((playlist) => {
							playlistIds.push(playlist.playlist_id)
						})
						client.setPlaylistIdsByVideoId(vid.id, playlistIds, ttl, projectId)
						resolve(videoData)
					})
				}
			})
		} else {
			resolve(videoData)
		}
	})
}

Util.createVideoQualityJSON = (vq) => {
	return {
		type: 'quality',
		id: vq.id,
		attributes: {
			title: vq.title,
			bitrate: vq.bitrate,
			width: vq.width,
			height: vq.height
		}
	}
}

Util.createPlaylistJSON = (pl) => {
	let isFree
	if (pl.id === config.playlist.free) {
		isFree = true
	} else {
		isFree = pl.parent_id != null ? pl.parent_id.split(' ').indexOf(config.playlist.free) >= 0 : false
	}

	return {
		type: 'playlist',
		id: pl.id,
		attributes: {
			name: pl.title,
			description: pl.description,
			visibility: pl.visibility,
			type: pl.content_type,
			country: pl.country_code,
			cover: pl.cover_url,
			icon: pl.icon_url,
			order: pl.sort_order,
			isFree: isFree,
			parentId: pl.parent_id,
			createdAt: pl.created_at
		}
	}
}

// createPreferenceJSON

Util.createPreferenceWithJSON = (pf, useRelationships, projectId) => {
	let pfData = Util.createPreferenceJSON(pf)
	if (useRelationships) {
		pfData.attributes.settings = []
	} else { // no relationships needed
		pfData.attributes.settings = {}
		return Promise.resolve(pfData)
	}

	return new Promise((resolve, reject) => {
		resolve(pfData)
	})
}

// createFavoriteWithJSON
Util.createFavoriteWithJSON = (fv, useRelationships, projectId) => {

}

// createVideoHistoryJSON

Util.createVideoHistoryWithJSON = (hs, useRelationships, projectId) => {
	let hsData = Util.createHistoryJSON(hs)
	if (useRelationships) {
		hsData.attributes.videos = []
	} else { // no relationships needed
		hsData.attributes.videos = {}
		return Promise.resolve(hsData)
	}

	return new Promise((resolve, reject) => {
		resolve(hsData)
	})
}

Util.createFavorites = async (res) => {
	let result = {
		id: res.id,
		type: 'video-favorites',
		attributes: {}
	}
	result.attributes.updatedAt = res.updated_at
	result.attributes.videoId = res.video_id
	result.attributes.videos = []

	return new Promise((resolve, reject) => {
		resolve(result)
	})
}

Util.createVideo = async (res) => {
	// let hsData = Util.createVideoJSON(res)

	// return new Promise((resolve, reject) => {
	// 	resolve(hsData)
	// })

	let result = {
		id: res.id,
		type: 'video',
		attributes: {}
	}
	delete res.id
	for (const key in res) {
		const newKey = await _.camelCase(key)
		result.attributes[newKey] = res[key]
	}

	return new Promise((resolve, reject) => {
		resolve(result)
	})
}

Util.toJSONApi = async (data, type) => {
	let result = {
		id: data.id,
		type,
		attributes: {}
	}
	delete data.id
	for (const key in data) {
		const newKey = await _.camelCase(key)
		result.attributes[newKey] = data[key]
	}
	return result
}

Util.createPlaylistWithVideoJSON = (pl, useRelationships, projectId) => {
	let plData = Util.createPlaylistJSON(pl)

	if (useRelationships) {
		plData.relationships = {
			video: {
				data: []
			},
			subplaylist: {
				data: []
			}
		}
	} else { // no relationships needed
		plData.relationships = {}
		return Promise.resolve(plData)
	}

	// get video relationship
	let getVideoRelationship = new Promise((resolve, reject) => {
		client.getVideoIdsByPlaylistId(pl.id, projectId).then((result) => {
			if (result != null) {
				let videos = []
				let getVideos = []
				// get every videos
				result.map((videoId) => {
					getVideos.push(
						new Promise((resolve, reject) => {
							client.getVideoById(videoId, projectId).then((result) => {
								if (result != null) {
									videos.push(result)
									resolve()
								} else {
									query.getVideo(videoId, projectId).then((result) => {
										if (result.length) {
											videos.push(result[0])
											client.setVideoById(videoId, result[0], ttl, projectId)
										} else {
											// video not found, invalidate video IDs
											client.delVideoIdsByPlaylistId(pl.id, projectId)
										}
										resolve()
									})
								}
							})
						})
					)
				})
				Promise.all(getVideos).then(() => {
					for (let vid of videos) {
						plData.relationships.video.data.push({ type: 'video', id: vid.id })
					}
					resolve(plData)
				})
			} else {
				query.getVideosByPlaylistID(pl.id, projectId).then((result) => {
					for (let vid of result) {
						plData.relationships.video.data.push({ type: 'video', id: vid.video_id })
					}
					// add to redis
					let videoIds = []
					result.map((video) => {
						videoIds.push(video.video_id)
					})
					client.setVideoIdsByPlaylistId(pl.id, videoIds, ttl, projectId)
					resolve(plData)
				})
			}
		})
	})

	// get subplaylist relationship
	let getSubplaylistRelationship = new Promise((resolve, reject) => {
		// get playlist children (sub-playlists)
		client.getSubplaylistIds(pl.id, projectId).then((result) => {
			if (result != null) {
				result.map((playlistId) => {
					let subplaylist = { type: 'playlist', id: playlistId }
					plData.relationships.subplaylist.data.push(subplaylist)
				})
				resolve()
			} else {
				query.getSubplaylists(pl.id, projectId).then((result) => {
					let subplaylistIds = []
					result.map((playlist) => {
						subplaylistIds.push(playlist.id)
					})
					client.setSubplaylistIds(pl.id, subplaylistIds, ttl, projectId)
					result.map((playlist) => {
						let subplaylist = { type: 'playlist', id: playlist.id }
						plData.relationships.subplaylist.data.push(subplaylist)
					})
					resolve()
				})
			}
		})
	})

	return new Promise((resolve, reject) => {
		Promise.all([getVideoRelationship, getSubplaylistRelationship]).then(() => {
			resolve(plData)
		})
	})
}

Util.createTeamJSON = (te) => {
	return {
		type: 'team',
		id: te.id,
		attributes: {
			name: te.name,
			officialWebsiteURL: te.official_website_url,
			home: te.home,
			logo: te.logo
		}
	}
}

Util.getTeamByIDs = (teamIDs, projectId) => {
	let teams = []
	let getTeams = []
	return new Promise((resolve, reject) => {
		teamIDs.map((teamId) => {
			getTeams.push(
				new Promise((resolve, reject) => {
					client.getTeamById(teamId, projectId).then((result) => {
						if (result != null) {
							teams.push(Util.createTeamJSON(result))
							resolve()
						} else {
							query.getTeamByID(teamId).then((result) => {
								teams.push(Util.createTeamJSON(result[0]))
								// add to redis
								client.setTeamById(teamId, result[0], ttl, projectId)
								resolve()
							})
						}
					})
				})
			)
		})
		Promise.all(getTeams).then(() => {
			resolve(teams)
		})
	})
}

Util.createArticleJSON = (article) => {
	return {
		type: 'article',
		id: article.id,
		attributes: {
			title: article.title,
			preview: article.preview,
			slug: article.slug,
			content: article.content,
			banner: article.banner
		}
	}
}

Util.createContentTypeJSON = (contentType) => {
	return {
		type: 'contentType',
		id: contentType.id,
		attributes: {
			name: contentType.name
		}
	}
}

Util.createScheduleJSON = (schedule) => {
	let scheduleData = {
		type: 'schedule',
		id: schedule.id,
		attributes: {
			title: schedule.title,
			start: schedule.start,
			end: schedule.end,
			description: schedule.description,
			createdAt: schedule.created_at
		}
	}

	if (schedule.playlist_id != null) {
		scheduleData.relationships = scheduleData.relationships || {}
		scheduleData.relationships.playlist = {
			data: {
				type: 'playlist',
				id: schedule.playlist_id
			}
		}
	}

	if (schedule.video_id != null) {
		scheduleData.relationships = scheduleData.relationships || {}
		scheduleData.relationships.video = {
			data: {
				type: 'video',
				id: schedule.video_id
			}
		}
	}

	return scheduleData
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

Util.newErrorObject = () => {
	return {
		errors: []
	}
}

Util.responseError = (res, err, statusCode) => {
	let errorJSON = Util.newErrorObject()
	res.setHeader('content-type', 'application/vnd.api+json')
	res.status(statusCode)
	let newError = {
		status: statusCode,
		code: err.code || undefined,
		title: err.title || undefined,
		detail: err.detail || undefined,
		source: err.source || undefined
	}
	errorJSON.errors.push(newError)
	res.json(errorJSON)
}

module.exports = Util
