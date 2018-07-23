'use strict'

const Recluster = require('recluster')
const Path = require('path')

let opt = {}

const cluster = Recluster(Path.resolve(__dirname, './dist/app.js'), opt)
cluster.run()

process.on('SIGUSR2', function () {
	console.log('Got SIGUSR2, reloading cluster...')
	cluster.reload()
})

console.log('spawned cluster, kill -s SIGUSR2', process.pid, 'to reload')
