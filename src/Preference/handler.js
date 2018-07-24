const _ = require('lodash')
const util = require('../util.js')

const query = require('../query.js')
const config = require('config')
const Redis = require('../redis.js')
const client = new Redis(config.redis.port, config.redis.host)
const ttl = config.redis.ttl
const HandlerPreference = {}

let getPreferenceData = (pf, useRelationships, projectId) => {
	let data = util.newJSONAPIObject()

	return new Promise((resolve, reject) => {
		new Promise((resolve, reject) => {
			resolve(pf)
		}).then((result) => {
			return result.map((pf) => {
				return new Promise((resolve, reject) => {
					util.createPreferenceWithJSON(pf, useRelationships, projectId).then((res) => {
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
		})

		resolve(data)
	})
}

HandlerPreference.getPreferenceByID = (req, res, next) => {
	let preferenceID = req.params.id
	const projectId = _.get(res, 'locals.projectId', null)

	let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1

	// get Preference from redis
	client.getPreferenceById(preferenceID, projectId).then((result) => {
		return new Promise((resolve, reject) => {
			if (result != null) {
				let arrResult = []
				if (result !== 'undefined') {
					arrResult.push(result)
				}
				resolve(arrResult)
			} else {
				query.getPreferenceByIDs(preferenceID, projectId).then((result) => {
					if (result.length) {
						// add to redis
						client.setPreferenceById(preferenceID, result[0], ttl, projectId)
						resolve(result)
					} else {
						let error = {
							status: 404,
							code: preferenceID,
							detail: `resource ${preferenceID.toLowerCase()} not found`,
							source: {
								'pointer': '/preferences'
							}
						}

						reject(error)
					}
				})
			}
		})
	}).then((result) => {
		return getPreferenceData(result, useRelationships, projectId)
	}).then((data) => {
		res.setHeader('content-type', 'application/vnd.api+json')
		res.json(data)
	}).catch(function (err) {
		return next(err)
	})
}

HandlerPreference.postNewPreference = (req, res, next) => {
	console.log(req.body)
	let data = req.body

	// debugger;

	const projectId = _.get(res, 'locals.projectId', null)

	// let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1
	query.insertPreference(data, projectId)
		// insert playlists relationship into table playlist_videos
		// resolve if playlists relationship is empty
		.then(() => {
			// remove from redis
			client.delPreferenceById(data.uid, projectId)

			res.setHeader('content-type', 'application/vnd.api+json')
			res.json(data)
		}).catch(err => {
			return next(err)
		})
}

HandlerPreference.UpdatePreference = (req, res, next) => {
	console.log(req.body)
	let data = req.body
	const projectId = _.get(res, 'locals.projectId', null)

	// let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1
	query.UpdatePreference(data, projectId)
		// insert playlists relationship into table playlist_videos
		// resolve if playlists relationship is empty
		.then(() => {
			// remove from redis
			client.delPreferenceById(data.uid, projectId)

			res.setHeader('content-type', 'application/vnd.api+json')
			res.json(data)
		}).catch(err => {
			return next(err)
		})
}

HandlerPreference.deletePreference = (req, res, next) => {
	let preferenceID = req.params.id

	const projectId = _.get(res, 'locals.projectId', null)

	query.deletePreference(preferenceID, projectId).then(() => {
		// remove from redis
		client.delPreferenceById(preferenceID, projectId)

		res.setHeader('content-type', 'application/vnd.api+json')
		res.json({ id: preferenceID, success: true })
	}).catch(err => {
		return next(err)
	})
}

module.exports = HandlerPreference
