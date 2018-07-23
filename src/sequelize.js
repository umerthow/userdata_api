const conf = require('config')
const Sequelize = require('sequelize')

const db = conf.db
export const dbSeq_video = new Sequelize('video', db.user, db.password, db)
export const dbSeq_user = new Sequelize('userdata', db.user, db.password, db)

dbSeq_video.authenticate().then(() => {
	console.log('Connection to DBvideo has been established successfully.')
}).catch(err => {
	console.error('Unable to connect to the database: ', err)
})

dbSeq_user.authenticate().then(() => {
	console.log('Connection to DBuserdata has been established successfully.')
}).catch(err => {
	console.error('Unable to connect to the database: ', err)
})
