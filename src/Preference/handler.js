import BigQuery from '@google-cloud/bigquery'
const _ = require('lodash')
const util = require('../util.js')
const projectId = 'staging-199507'
const bigquery = new BigQuery({
	projectId,
	credentials: {
		private_key:
			'-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCdei7nXCSItkGf\npk+j6gCxWSHNId+vxRwoSiEvd+Gb2xBLvBjQcv6bCswn9z1t9ENuZygEw8/GF1mv\nN/lL9qgfQcty6AevbB1mV2vOuIvxeuybVWq9cXw/pW3MrxfXIQiP39T5syHKL18v\nbKKyqlQWilmlemiC7dQdMPnrDqp4qevfmrMOSiVLuxC5jKGT8tN+ct2OF41Elcoi\nwdAYNj5fSa+RqNOY670z3V5nCrsvS8MPGAc40w6TB+BlJSC50nG8ybuhGjPajNfU\n7kFe6QsL/5mKahHHWssJt+A8gI7rsixM3szN3fr1LWVXOocf2UCdaE98ouie/MKp\nGYQpTpTVAgMBAAECggEASqRIyhnXKUO2DC2gzxFRvb4BMwFszJvxkjk8zIqWkbC+\nYx9nZZo0CxoNlZ3vbIgcVB6qDcQgXgTgWhh+Xh6uJo6hl7faOLBWqRUjwOqhTlbV\nAnV0sBGz8lj/l8agVrROIh/Wi3p4OCTHCawE3Am27K4r+q7wDasb4LA/rUYY0DL/\n44AMgEo+ZDG9dkQUv81HWCmrl2McJmpBggRaBsbbOZjqRbyZH4bPbDPC8MLp4j1V\nV94/5wCpmWTpWLD3Qyom7ge6CVZOhRZ23GDEWrJ6gJfviWeq758q2AAVRVRer9e0\nEDY0ztSDBa2x/5Ek32nHorXG1D6woSTUZ/TFE3uf6wKBgQDQlBwkFhhNdw6NBqLx\nui6vt/WDGPjVVSOs33QS/wTa2xLHlPOZIrrZAvqu14r3WKc581dgEExlIGY/V0ap\n75kuXXvSZcIRQR6nizv9+ZL1bRA6YgYw1JfAhWzSDBplfLyXixyneFWHGtDkLbF5\nCDN5TUMjtIZuw2tvVMFp9v2FLwKBgQDBR9PazmOnyg7jXufucYLHGHGpQEBK8xjt\nyY2/YVIbMTVHlnXrtkdyqhhlglsIaG+KO06prZNFI8aH+bRRqY5sM6QpqS4Qqcwr\n56VTqgtdNyzIr/waWILDpkKD7F797B+ImhEOFNEFgY6CtZ0cR3MFTacorLFSMKus\nEoIMuFqNOwKBgBoEj6oUs31eP4tp64N5tP8oVFDBGbEKyMN0sDb6ZrGiKCqLMwPE\nKEiPrZOHwYbvIRUCfMC357+plfeKvH7QK2x0LtDk7ptWYyuFG7unmSRSMXcG6TzI\nGBHk0tk0t0o3kBLbQHzHbuvGdY4xAPVXB4y3DYvzpd1FNS6TBPlh3OfzAoGAICep\n+DHz5Fs6RNtqLIIX5rWLW0QELjPpRs4MVfWD6mAyY/mFHrTRiCMCMgkQygJN5Cpf\nuNzWrl74TXDebeOOfTPOMNwjfMQy4m8EUznr8BMY0T5t65gkERac5EOzvfzFdj1j\nbvtJlufp5JcAT08XtJ8pmxu32F ueg98EYcdd0TcCgYAngjlNrSSKW9ZciQDCSbAC\n5xRyh5dg/HprJXPotm0cvquhdi3ABP8FH0nbEvSjDiTqGthP52XqRx029s2g8ApA\nSp/vruaqZu5otY9LY1GI138d78LAJgbBQNDGeQ/dVEXJOWqoy6ff5LhPWg5w2Cqp\ngbFwYoY2ZrD82uosnm1mng==\n-----END PRIVATE KEY-----\n',
		client_email: 'bigquery-client-admin@staging-199507.iam.gserviceaccount.com'
	}
})

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
				if (result != 'undefined') {
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
	let preferenceID = req.params.id
	console.log(req.body)
	let data = req.body

	// debugger;

	const projectId = _.get(res, 'locals.projectId', null)

	let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1
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
	let preferenceID = req.params.id
	console.log(req.body)
	let data = req.body
	const projectId = _.get(res, 'locals.projectId', null)

	let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1
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
