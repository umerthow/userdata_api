/* eslint-disable camelcase */
const dotenv = require('dotenv')
const exceptions = ['production', 'staging']

/* Override the values if the environment is not in the exception lists */
if (!exceptions.includes(process.env.NODE_ENV)) {
	dotenv.config()
}

const {
	APINAME_SERVER_APP_PORT,

	APINAME_DATABASE_MASTER_DRIVER,
	APINAME_DATABASE_MASTER_HOST,
	APINAME_DATABASE_MASTER_PORT,
	APINAME_DATABASE_MASTER_USERNAME,
	APINAME_DATABASE_MASTER_PASSWORD,
	APINAME_DATABASE_MASTER_DATABASE1,
	APINAME_DATABASE_MASTER_DATABASE2,

	APINAME_REDIS_HOST,
	APINAME_REDIS_PORT,
	APINAME_REDIS_PREFIX,
	APINAME_REDIS_TTL,

	APINAME_SENTRY_DSN,

	APINAME_API_CLIENT_DOMAIN,
	APINAME_API_CLIENT_KEY,
	APINAME_API_CLIENT_SECRET,

	npm_package_version
} = process.env

module.exports = {
	app: {
		port: APINAME_SERVER_APP_PORT
	},
	api: {
		version: npm_package_version || '1.0'
	},
	scope: {},
	db: {
		host: APINAME_DATABASE_MASTER_HOST,
		port: APINAME_DATABASE_MASTER_PORT,
		dialect: APINAME_DATABASE_MASTER_DRIVER,
		name1: APINAME_DATABASE_MASTER_DATABASE1,
		name2: APINAME_DATABASE_MASTER_DATABASE2,
		user: APINAME_DATABASE_MASTER_USERNAME,
		password: APINAME_DATABASE_MASTER_PASSWORD
	},
	cache: {
		ttl: 30
	},
	redis: {
		host: APINAME_REDIS_HOST,
		port: APINAME_REDIS_PORT,
		prefix: APINAME_REDIS_PREFIX,
		ttl: APINAME_REDIS_TTL
	},
	sentry: {
		dsn: APINAME_SENTRY_DSN || {} // <- This is used to always disable DSN error reporting in local environment
	},
	apiClient: {
		domain: APINAME_API_CLIENT_DOMAIN,
		key: APINAME_API_CLIENT_KEY,
		secret: APINAME_API_CLIENT_SECRET
	}
}
