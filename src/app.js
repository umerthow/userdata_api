// Add timestamp to console method
import 'babel-polyfill'
import 'log-timestamp'

import _ from 'lodash'

import BigQuery from '@google-cloud/bigquery'
import moment from 'moment'

import express from 'express'
import Raven from 'raven'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import config from 'config'
import cors from 'cors'
import gracefulExit from 'express-graceful-exit'

import util from './util'

const HandlerHistory = require('./History/handler.js')
const HandlerPreference = require('./Preference/handler.js')
const HandlerFavorites = require('./Favorites/handler.js')
// const HandlerVideo = require('./Video/handler.js');
// const HandlerPlaylist = require('./Playlist/handler.js');
// const HandlerAd = require('./Ad/handler.js');

const StardustMiddleware = require('@supersoccer/stardust-client')
	.StardustMiddleware
const Heimdall = require('@supersoccer/super-heimdall').Heimdall

const AuthPassport = require('@supersoccer/api-auth-passport').default
// const APIClient = require('@supersoccer/api-client').default;
// Superset APICLIENT
const APIClient = require('@supersoccer/api-client-superset').default

const apiClient = new APIClient({
	apiDomain: config.apiClient.domain
	// v1: true
})

const projectId = 'staging-199507'
const bigquery = new BigQuery({
	projectId,
	credentials: {
		private_key:
			'-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCdei7nXCSItkGf\npk+j6gCxWSHNId+vxRwoSiEvd+Gb2xBLvBjQcv6bCswn9z1t9ENuZygEw8/GF1mv\nN/lL9qgfQcty6AevbB1mV2vOuIvxeuybVWq9cXw/pW3MrxfXIQiP39T5syHKL18v\nbKKyqlQWilmlemiC7dQdMPnrDqp4qevfmrMOSiVLuxC5jKGT8tN+ct2OF41Elcoi\nwdAYNj5fSa+RqNOY670z3V5nCrsvS8MPGAc40w6TB+BlJSC50nG8ybuhGjPajNfU\n7kFe6QsL/5mKahHHWssJt+A8gI7rsixM3szN3fr1LWVXOocf2UCdaE98ouie/MKp\nGYQpTpTVAgMBAAECggEASqRIyhnXKUO2DC2gzxFRvb4BMwFszJvxkjk8zIqWkbC+\nYx9nZZo0CxoNlZ3vbIgcVB6qDcQgXgTgWhh+Xh6uJo6hl7faOLBWqRUjwOqhTlbV\nAnV0sBGz8lj/l8agVrROIh/Wi3p4OCTHCawE3Am27K4r+q7wDasb4LA/rUYY0DL/\n44AMgEo+ZDG9dkQUv81HWCmrl2McJmpBggRaBsbbOZjqRbyZH4bPbDPC8MLp4j1V\nV94/5wCpmWTpWLD3Qyom7ge6CVZOhRZ23GDEWrJ6gJfviWeq758q2AAVRVRer9e0\nEDY0ztSDBa2x/5Ek32nHorXG1D6woSTUZ/TFE3uf6wKBgQDQlBwkFhhNdw6NBqLx\nui6vt/WDGPjVVSOs33QS/wTa2xLHlPOZIrrZAvqu14r3WKc581dgEExlIGY/V0ap\n75kuXXvSZcIRQR6nizv9+ZL1bRA6YgYw1JfAhWzSDBplfLyXixyneFWHGtDkLbF5\nCDN5TUMjtIZuw2tvVMFp9v2FLwKBgQDBR9PazmOnyg7jXufucYLHGHGpQEBK8xjt\nyY2/YVIbMTVHlnXrtkdyqhhlglsIaG+KO06prZNFI8aH+bRRqY5sM6QpqS4Qqcwr\n56VTqgtdNyzIr/waWILDpkKD7F797B+ImhEOFNEFgY6CtZ0cR3MFTacorLFSMKus\nEoIMuFqNOwKBgBoEj6oUs31eP4tp64N5tP8oVFDBGbEKyMN0sDb6ZrGiKCqLMwPE\nKEiPrZOHwYbvIRUCfMC357+plfeKvH7QK2x0LtDk7ptWYyuFG7unmSRSMXcG6TzI\nGBHk0tk0t0o3kBLbQHzHbuvGdY4xAPVXB4y3DYvzpd1FNS6TBPlh3OfzAoGAICep\n+DHz5Fs6RNtqLIIX5rWLW0QELjPpRs4MVfWD6mAyY/mFHrTRiCMCMgkQygJN5Cpf\nuNzWrl74TXDebeOOfTPOMNwjfMQy4m8EUznr8BMY0T5t65gkERac5EOzvfzFdj1j\nbvtJlufp5JcAT08XtJ8pmxu32F ueg98EYcdd0TcCgYAngjlNrSSKW9ZciQDCSbAC\n5xRyh5dg/HprJXPotm0cvquhdi3ABP8FH0nbEvSjDiTqGthP52XqRx029s2g8ApA\nSp/vruaqZu5otY9LY1GI138d78LAJgbBQNDGeQ/dVEXJOWqoy6ff5LhPWg5w2Cqp\ngbFwYoY2ZrD82uosnm1mng==\n-----END PRIVATE KEY-----\n',
		client_email: 'bigquery-client-admin@staging-199507.iam.gserviceaccount.com'
	}
})

// Must configure Raven before doing anything else with it
Raven.config(config.sentry.dsn).install()

const getHostmaps = async app => {
	app.locals.hosts = await apiClient.service.config
		.getHostnameMappings()
		.then(result => {
			console.log('Refresh Hostnames from Heimdall')
			result = result || []
			console.log(result)
			return result
		})
		.catch(error => {
			console.error(error)
			return []
		})
}

Raven.context(async function () {
	const authPassport = new AuthPassport({
		api: 'videos',
		store: {
			dialect: 'redis',
			host: config.redis.host,
			port: config.redis.port
		}
	})

	const app = express()
	const port = config.app.port || 4000

	// Initialize hostmaps
	getHostmaps(app)

	app.disable('x-powered-by')

	// The request handler must be the first middleware on the app
	app.use(Raven.requestHandler())

	// enable graceful exit
	app.use(gracefulExit.middleware(app))

	// Enable stardust tracker middleware
	// app.use(
	//   StardustMiddleware(
	//     {
	//       //host: 'http://localhost',
	//       prefix: "api.videos"
	//     },
	//     (req, res) => {
	//       return req.method === "GET" && req.path !== "/";
	//     }
	//   )
	// );

	app.use(bodyParser.urlencoded({ extended: false }))
	app.use(bodyParser.json())

	app.use(
		morgan(
			`${
				process.env.WORKER_ID
			} :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"`
		)
	)

	const scopes = config.scope

	const router = express.Router()

	// ads xml using custom cors
	// let corsOptions = {
	// 	origin: true,
	// 	credentials: true
	// }
	// Enable cors
	app.use(cors())

	// Enable heimdall middleware
	app.use(Heimdall(app))

	// Route for refreshing superset hostname maps
	router.get('/ping', async function (req, res, next) {
		res.send('PONG')
	})

	// Route for refreshing superset hostname maps
	router.get('/update', async function (req, res, next) {
		// await getHostmaps(app);
		res.json({ 'Hostnames updated!': app.locals.hosts })
	})

	// Stream insert bigquery
	router.get('/stream', async (req, res, next) => {
		const datasetId = 'sstv_bucket'
		const tableId = 'userdata_video_histories'
		const rows = [
			{
				uid: 'kareemlukitomo123',
				project_id: 'supersoccertv',
				video_id: '0361231622',
				created_at: moment().format('YYYY-MM-DD HH:mm:SS'),
				updated_at: moment().format('YYYY-MM-DD HH:mm:SS'),
				time_position: 670
			}
		]

		// Inserts data into a table
		bigquery
			.dataset(datasetId)
			.table(tableId)
			.insert(rows)
			.then(result => {
				res.json(result)
				console.log(`Inserted ${rows.length} rows`)
			})
			.catch(err => {
				if (err && err.name === 'PartialFailureError') {
					if (err.errors && err.errors.length > 0) {
						console.log('Insert errors:')
						err.errors.forEach(err => console.error(err))
						res.json(err).status(400)
					}
				} else {
					console.error('ERROR:', err)
					res.status(err.code || 400).json(err)
				}
			})
	})

	// route video history
	router.get('/userdata/:id/video/history', authPassport.validate({ scope: scopes.historyRead, credentialsRequired: false }), HandlerHistory.getHistoryByID)

	// route preference
	router.get('/userdata/:id/preference', authPassport.validate({ scope: scopes.preferenceRead, credentialsRequired: false }), HandlerPreference.getPreferenceByID)
	router.post('/userdata/preference', authPassport.validate({ scope: scopes.preferenceInsert, credentialsRequired: false }), HandlerPreference.postNewPreference)
	router.put('/userdata/preference', authPassport.validate({ scope: scopes.preferenceUpdate, credentialsRequired: false }), HandlerPreference.UpdatePreference)
	router.delete('/userdata/:id/preference', authPassport.validate({ scope: scopes.preferenceDelete, credentialsRequired: false }), HandlerPreference.deletePreference)

	// route video-favorite
	router.post('/userdata/favorites', authPassport.validate({ scope: scopes.favoritesInsert, credentialsRequired: false }), HandlerFavorites.postNewFavorite)

	router.get('/', function (req, res, next) {
		res.end()
	})

	app.use('/', router)

	// The error handler must be before any other error middleware
	app.use(Raven.errorHandler())

	// Optional fallthrough error handler
	app.use(function onError (err, req, res, next) {
		if (err.name === 'UnauthorizedError') {
			// error validate token such as expired
			res.status(401).end()
		} else {
			console.error(err)
			res.status(err.status).json(err)
		}
	})

	var server = app.listen(port)
	console.log('Listening at port: ' + port)
})

process.on('unhandledRejection', (reason, p) => {
	console.error('Unhandled Rejection at:', p, 'reason:', reason)
	Raven.captureException(reason)
	// application specific logging, throwing an error, or other logic here
})

// graceful exit on SIGTERM
process.on('SIGTERM', () => {
	console.log('SIGTERM RECEIVED')
	gracefulExit.gracefulExitHandler(app, server, {
		log: true,
		exitDelay: 0
	})
})
