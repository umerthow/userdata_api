const _ = require('lodash')
const util = require('../util.js')

const query = require('../query.js')
const config = require('config')
const Redis = require('../redis.js')
const client = new Redis(config.redis.port, config.redis.host)
const ttl = config.redis.ttl
const HandleFavorites = {}

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
			client.delPreferenceById(data.uid, projectId)

			res.setHeader('content-type', 'application/vnd.api+json')
			res.json(data)
		}).catch(err => {
			return next(err)
		})
}

module.exports = HandleFavorites
