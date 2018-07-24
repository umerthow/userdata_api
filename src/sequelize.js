const conf = require('config')
const Sequelize = require('sequelize')

const db = conf.db
export const dbSeqVideo = new Sequelize('video', db.user, db.password, db)
export const dbSeqUser = new Sequelize('userdata', db.user, db.password, db)

dbSeqVideo.authenticate().then(() => {
	console.log('Connection to DBvideo has been established successfully.')
}).catch(err => {
	console.error('Unable to connect to the database: ', err)
})

dbSeqUser.authenticate().then(() => {
	console.log('Connection to DBuserdata has been established successfully.')
}).catch(err => {
	console.error('Unable to connect to the database: ', err)
})
