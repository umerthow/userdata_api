const _ = require('lodash')
const Util = require('../util.js')
const query = require('../query.js')
const config = require('config')
const Redis = require('../redis.js')
const client = new Redis(config.redis.port, config.redis.host)

const ttl = config.redis.ttl
const HandlerPlaylist = {}

HandlerPlaylist.custumSort = (a, b) => {
	return new Date(b.attributes.updatedAt).getTime() - new Date(a.attributes.updatedAt).getTime()
}

let getVidPlaylist = (hs, useRelationships, projectId) => {
	let data = Util.newJSONAPIObject()

	return new Promise((resolve, reject) => {
		new Promise((resolve, reject) => {
			console.log(hs)
			resolve(hs)
		}).then((result) => {
			return result.map((hs) => {
				debugger
				return new Promise((resolve, reject) => {
					Util.toPlaylistVidApi(hs, useRelationships, projectId).then((res) => {
						data.data.push(res)
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
					// data_.videos.data.push({ "test": "test", "video_id": data_.videoId })
					const x = new Promise((resolve, reject) => {
						debugger
						client.getVideoById(data_.attributes.videoId, projectId).then((result) => {
							if (result != null) {
								console.log('cek redis')
								debugger
								return new Promise((resolve, reject) => {
									Util.createVideo(result).then((res) => {
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
										let allData = result[0]
										debugger
										console.log(allData)
										return new Promise(async (resolve, reject) => {
											Util.createVideo(allData).then((res) => {
												data_.attributes.videos.push(res)
												resolve()
											})

											client.setVideoById(data_.attributes.videoId, result[0], ttl, projectId)
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

				for (let it of hs) {
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
				}

				return Promise.resolve(data)
			}).then(() => {
				console.log('log terakhir')
				resolve(data)
			})
	})
}
/*
let cekya = (adjustMen, projectId) => {
	var newdata = Util.newJSONAPIObject()
	adjustMen.map(async (vid) => {
		client.getVideoById(vid.attributes.videoId, projectId).then(result => {
			if (result != null) {
				// return the data back
			} else {
				return query.getVideo(vid.attributes.videoId, projectId).then((result) => {
					if (result.length) {
						let VidData = result[0]
						Util.createVideo(VidData).then((res) => {
							vid.attributes.videos.push(res)
							debugger
						})
					} else {
						vid.attributes.videos.push({ 'videos': 'not found' })
					}
				})
			}
		}).then((result) => {
			debugger
			console.log(result)
		})
	})
}
*/
HandlerPlaylist.readCustPlaylist = async (req, res, next) => {
	let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1
	let userID = req.params.id
	console.log(userID)
	const projectId = _.get(res, 'locals.projectId', null)
	debugger
	try {
		debugger
		client.getCustPlaylist(userID, projectId).then(result => {
			if (result != null) {
				debugger
				return result
			} else {
				return query.getCustPLaylist(userID, projectId).then(result => {
					if (result.length) {
						debugger
						client.setCustPlaylistbyID(userID, result, ttl, projectId)
						return result
					} else {
						debugger
						let error = {
							status: 404,
							code: userID,
							detail: `resource ${userID.toLowerCase()} not found`,
							source: {
								'pointer': '/playlist'
							}
						}
						res.status(error.status).send({ error: error })
					}
				})
			}
		}).then((result, err) => {
			return new Promise(async (resolve, reject) => {
				if (result === undefined) {
					debugger
					reject(err)
				} else {
					let datas = await getVidPlaylist(result, useRelationships, projectId)
					resolve(datas)
				}
			})
		}).then((data) => {
			// let newdata = {}
			console.log(data.data)
			var sortData = data.data.sort(HandlerPlaylist.custumSort)

			var grades = {}
			sortData.forEach(function (item) {
				var grade = grades[item.id] = grades[item.id] || {}
				grade[item.key] = grade[item.type]
			})

			console.log(JSON.stringify(grades, null, 4))

			res.setHeader('content-type', 'application/vnd.api+json')
			res.json({ data: sortData })
		}).catch(function (err) {
			return next(err)
		})
	} catch (error) {
		res.status(400).error()
	}
}

HandlerPlaylist.deleteVidPlaylist = async (req, res, next) => {
	let data = req.body
	console.log(req.body)
	const projectId = _.get(res, 'locals.projectId', null)
	try {
		let processDelete = await query.deleteVidPLaylist(data, projectId)
		if (processDelete instanceof Error) throw processDelete
		debugger
		// client.delCustPlaylist(data.userId, projectId)
		res.json(processDelete)
	} catch (error) {
		debugger
		let newError = error.errors[0]
		let errMessages = {
			'message': newError.message,
			'status': 400
		}

		res.status(400).json(errMessages)
	}
}

HandlerPlaylist.deletePlaylist = async (req, res, next) => {
	let data = req.body
	console.log(req.body)
	const projectId = _.get(res, 'locals.projectId', null)
	try {
		let processDelete = await query.deleteCustPlaylist(data, projectId)
		if (processDelete instanceof Error) throw processDelete
		debugger
		client.delCustPlaylist(data.userId, projectId)
		res.json(processDelete)
	} catch (error) {
		debugger
		let newError = error.errors[0]
		let errMessages = {
			'message': newError.message,
			'status': 400
		}

		res.status(400).json(errMessages)
	}
}

HandlerPlaylist.updateCustPlaylist = async (req, res, next) => {
	console.log(req.body)
	let data = req.body
	const projectId = _.get(res, 'locals.projectId', null)

	// let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1
	try {
		let procossUpdate = await query.updateCustPlaylist(data, projectId)
		if (procossUpdate instanceof Error) throw procossUpdate
		debugger
		client.delCustPlaylist(data.userId, projectId)
		res.json(data)
	} catch (error) {
		debugger
		let newError = error.errors[0]
		let errMessages = {
			'message': newError.message,
			'status': 400
		}

		res.status(400).json(errMessages)
	}
}

HandlerPlaylist.postNewVidPlaylist = async (req, res, next) => {
	console.log(req.body)
	let data = req.body

	const projectId = _.get(res, 'locals.projectId', null)

	try {
		let processInsert = await query.insertCustPlaylistVid(data, projectId)
		if (processInsert instanceof Error) throw processInsert

		client.delCustPlaylist(data.userId, projectId)
		res.json(processInsert)
	} catch (error) {
		let newError = error.errors[0]
		let errMessages = {
			'message': newError.message,
			'status': 400
		}

		res.status(400).json(errMessages)
	}
}

HandlerPlaylist.postNewPlaylist = async (req, res, next) => {
	console.log(req.body)
	let data = req.body
	const projectId = _.get(res, 'locals.projectId', null)

	try {
		let resultInsert = await query.insertCustPlaylist(data, projectId)
		if (resultInsert instanceof Error) throw resultInsert
		debugger
		client.delCustPlaylist(data.userId, projectId)
		res.json(resultInsert)
	} catch (error) {
		debugger
		let newError = error.errors[0]
		let errMessages = {
			'message': newError.message,
			'status': 400
		}

		res.status(400).json(errMessages)
	}

	/*
		// let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1
		let processInsert = (query.insertCustPlaylist(data, projectId)
			// insert custom playlists
			.then(() => {
				// remove from redis
				client.delCustPlaylist(data.uid, projectId)
				res.setHeader('content-type', 'application/vnd.api+json')
				res.json(data)
			}).catch(err => {
				return next(err)
			})

	*/
}

module.exports = HandlerPlaylist
