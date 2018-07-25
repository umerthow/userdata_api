const _ = require('lodash')
const util = require('../util.js')

const query = require('../query.js')
const config = require('config')
const Redis = require('../redis.js')
const client = new Redis(config.redis.port, config.redis.host)
// const ttl = config.redis.ttl
const HandleFavorites = {}

let getFavoritesData = (fv, useRelationships, projectId) => {
	let data = util.newJSONAPIObject()

	return new Promise((resolve, reject) => {
		new Promise((resolve, reject) => {
			resolve(fv)
		}).then((result) => {
			debugger
			console.log(fv)
			return result.map((fv) => {
				return new Promise((resolve, reject) => {
					util.createFavorites(fv).then((res) => {
						data.data.push(res)
						debugger
						console.log(res)
						resolve()
					})
				})
			})
		}).then((promises) => {
			return new Promise((resolve, reject) => {
				Promise.all(promises).then(() => {
					resolve()
				})
			})
		})// get unique video id to include them into json result
			.then(() => {
				if (!useRelationships) {
					return Promise.resolve([])
				}
				let videoIds = []

				debugger
				for (let data_ of data.data) {
					const x = new Promise((resolve, reject) => {
						debugger
						client.getVideoById(data_.attributes.videoId, projectId).then((result) => {
							if (result != null) {
								return new Promise((resolve, reject) => {
									util.createVideo(result).then((res) => {
										console.log('cek redis')
										debugger
										data_.attributes.videos.push(res)
										resolve()
									})
								})
							} else {
								query.getVideo(data_.attributes.videoId, projectId).then((result) => {
									if (result.length) {
										// data.videos.data.push(result[0]);
										// data_.attributes.videos.push(result[0])
										// console.log(result)
										let allData = result[0].dataValues
										debugger
										console.log(allData)
										return new Promise(async (resolve, reject) => {
											util.createVideo(allData).then((res) => {
												data_.attributes.videos.push(res)
												resolve()
											})

											// client.setVideoById(data_.attributes.videoId, result[0], ttl, projectId)
										})
									} else {
										data_.attributes.videos.push({ 'videos': 'not_found' })
									}
									resolve()
								})
							}
						})
					})

					x.then(console.log(x))
				}

				for (let it of fv) {
					debugger
					videoIds.push(it.video_id)
				}

				return Promise.resolve(_.uniq(videoIds))
			}).then((videoIds) => {
				console.log(videoIds)
				var videos = []
				var getVideos = []
				return new Promise((resolve, reject) => {
					videoIds.map((videoId) => {
						getVideos.push(
							new Promise((resolve, reject) => {
								client.getVideoById(videoId, projectId).then((result) => {
									if (result != null) {
										resolve()
									} else {
										query.getVideo(videoId, projectId).then((result) => {
											resolve()
										})
									}
								})
							})
						)
					})
					Promise.all(getVideos).then(() => {
						resolve(videos)
					})
				})
			}) // get unique team id to include them into json result
			.then((videos) => {
				console.log('cek delete')
				for (let item of data.data) {
					delete item.attributes.videoId
					delete item.attributes.id
				}

				return Promise.resolve(data)
			}).then(() => {
				console.log('log terakhir')
				resolve(data)
			})
	})
}

HandleFavorites.postNewFavorite = (req, res, next) => {
	console.log(req.body)
	let data = req.body
	const projectId = _.get(res, 'locals.projectId', null)

	// let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1
	query.insertFavorites(data, projectId)
		// insert playlists relationship into table playlist_videos
		// resolve if playlists relationship is empty
		.then(() => {
			// remove from redis
			client.delUserVidFavorites(data.uid, projectId)
			res.setHeader('content-type', 'application/vnd.api+json')
			res.json(data)
		}).catch(err => {
			return next(err)
		})
}

HandleFavorites.UpdateFavorite = (req, res, next) => {
	console.log(req.body)
	let data = req.body
	const projectId = _.get(res, 'locals.projectId', null)

	// let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1
	query.UpdateFavorites(data, projectId)
		// insert playlists relationship into table playlist_videos
		// resolve if playlists relationship is empty
		.then(() => {
			// remove from redis
			client.delUserVidFavorites(data.uid, projectId)
			res.setHeader('content-type', 'application/vnd.api+json')
			res.json(data)
		}).catch(err => {
			return next(err)
		})
}

HandleFavorites.deleteFavorite = (req, res, next) => {
	let data = req.body
	console.log(req.body)
	const projectId = _.get(res, 'locals.projectId', null)

	query.deleteFavorites(data, projectId).then(() => {
		// remove from redis
		client.delUserVidFavorites(data.uid, projectId)

		res.setHeader('content-type', 'application/vnd.api+json')
		data.status = 'success delete'
		res.json(data)
	}).catch(err => {
		return next(err)
	})
}

HandleFavorites.getFavoritesByID = (req, res, next) => {
	let userID = req.params.id
	const projectId = _.get(res, 'locals.projectId', null)

	let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1
	let favorit = []
	// get Preference from redis
	client.getUserVidFavorites(projectId, userID).then((result) => {
		return new Promise((resolve, reject) => {
			if (result != null) {
				if (result !== 'undefined') {
					console.log('cek redis')
					favorit.push(result)
				}
				resolve(result)
				debugger
				console.log(favorit)
			} else {
				query.getFavoritesByIDs(userID, projectId).then((result) => {
					if (result.length) {
						// add to redis
						// client.setUserVidFavorites(userID, result, ttl, projectId)
						debugger
						resolve(result)
					} else {
						let error = {
							status: 404,
							code: userID,
							detail: `resource ${userID.toLowerCase()} not found`,
							source: {
								'pointer': '/favorites'
							}
						}

						reject(error)
					}
					debugger
					console.log(result)
				})
			}
		})
	}).then((result) => {
		debugger
		return getFavoritesData(result, useRelationships, projectId)
	}).then((data) => {
		res.setHeader('content-type', 'application/vnd.api+json')
		res.json(data)
	}).catch(function (err) {
		return next(err)
	})
}

module.exports = HandleFavorites
