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
const redis = require('../redis.js')
const client = new redis(config.redis.port, config.redis.host)
const ttl = config.redis.ttl

const HandlerHistory = {}

let getHistoryData = (hs, useRelationships, projectId) => {
	let data = util.newJSONAPIObject()
	debugger
	return new Promise((resolve, reject) => {
		new Promise((resolve, reject) => {
			resolve(hs)
		}).then((result) => {
			return result.map((hs) => {
				debugger
				return new Promise((resolve, reject) => {
					util.createVideoHistoryWithJSON(hs, useRelationships, projectId).then((res) => {
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
								console.log('cek itt a')

								return new Promise((resolve, reject) => {
									util.createVideo(result).then((res) => {
										data_.attributes.videos.push(res)
										resolve()
									})
								})
							} else {
								query.getVideo(data_.attributes.videoId, projectId).then((result) => {
									if (result.length) {
										// data.videos.data.push(result[0]);
										data_.attributes.videos.push(result[0])
										client.setVideoById(data_.attributes.videoId, result[0], ttl, projectId)
									} else {
										data_.attributes.videos.push({ 'videos': 'not_found' })
									}
									resolve()
								})
							}
						})
					})
				}

				for (let it of hs) {
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
			.then(() => {
				resolve(data)
			})
	})
}

HandlerHistory.getHistoryByID = (req, res, next) => {
	let useRelationships = req.query.relationships ? parseInt(req.query.relationships) : 1
	const projectId_ = _.get(res, 'locals.projectId', null)
	let userID = req.params.id
	var history = []

	// cek redis
	const p = new Promise((resolve, reject) => {
		client.getUserVidHistory(projectId_, userID).then((result) => {
			return new Promise((resolve, reject) => {
				if (result != null) {
					console.log('cek redis')
					history.push(result)
					resolve(result)
				} else {
					console.log('cek biq query')
					// cek the Bigquery
					bigquery
						.query({
							query:
								`
                                SELECT a.*,b.time_position FROM (

                                SELECT uid, project_id,video_id,max(updated_at) as updated_at FROM sstv_bucket.userdata_video_histories
                                WHERE 
                                project_id =?
                                AND
                                uid = ?
                                GROUP BY video_id,uid, project_id
                                ) as a
                                
                                INNER JOIN sstv_bucket.userdata_video_histories b 
                                ON a.video_id = b.video_id
                                WHERE a.updated_at = b.updated_at`,
							useLegacySql: false,
							params: [projectId_, userID]
						}).then(async results => {
							if (results != null) {
								// add to redis
								let rows = results[0]
								client.setUserVidHistory(userID, rows, ttl, projectId_)
								resolve(rows)
							} else {
								let rows = null
								resolve(rows)
							}
						})
				}
			}).then((rows) => {
				debugger
				return getHistoryData(rows, useRelationships, projectId_)
			}).then((data) => {
				res.setHeader('content-type', 'application/vnd.api+json')
				res.json(data)
			}).catch(function (err) {
				return next(err)
			})
		})
	})
}

module.exports = HandlerHistory
