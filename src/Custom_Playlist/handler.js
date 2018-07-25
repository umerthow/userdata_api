const _ = require('lodash')
const util = require('../util.js')
const query = require('../query.js')
const config = require('config')
const Redis = require('../redis.js')
const client = new Redis(config.redis.port, config.redis.host)
const ttl = config.redis.ttl

let postNewPlaylist = (req, res, next) => {

}
