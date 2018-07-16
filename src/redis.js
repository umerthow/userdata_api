const redis = require('redis');
const config = require('config');

class Redis {
	constructor(port, host) {
		this.client = redis.createClient(port, host, {prefix: config.redis.prefix+':' });
		this.client.on("error", function (err) {
				console.log("Error " + err);
		});
	}
	
	// basic set, get, del
	setRedis(key, value, ttl) {
		if(ttl != null) {
			this.client.set(key, JSON.stringify(value), 'EX', ttl);
		} else {
			this.client.set(key, JSON.stringify(value));
		}
	}

	getRedis(key) {
		return new Promise((resolve, reject) => {
			this.client.get(key, (err, reply) => {
				if (reply == null) {
					return resolve(reply);
				}

				try {
					let result = JSON.parse(reply);
					return resolve(result);
				} catch(err) {
					return resolve(null);
				}
			})
		})
	}

	delRedis(key) {
		this.client.del(key);
	}  
	
	/* VIDEO */
	// video by ID
	setVideoById(videoId, value, ttl, projectId) {
		let redisKey = projectId + ':video:id:' + videoId;
		this.setRedis(redisKey, value, ttl);
	}

	getVideoById(videoId, projectId) {
		let redisKey = projectId + ':video:id:' + videoId;
		return this.getRedis(redisKey);
	}

	delVideoById(videoId, projectId) {
		let redisKey = projectId + ':video:id:' + videoId;
		this.delRedis(redisKey); 
	}

	// video IDs by playlist ID
	setVideoIdsByPlaylistId(videoId, value, ttl, projectId) {
		let redisKey = projectId + ':video_ids:playlist_id:' + videoId;
		this.setRedis(redisKey, value, ttl);
	}

	getVideoIdsByPlaylistId(videoId, projectId) {
		let redisKey = projectId + ':video_ids:playlist_id:' + videoId;
		return this.getRedis(redisKey);
	}

	delVideoIdsByPlaylistId(videoId, projectId) {
		let redisKey = projectId + ':video_ids:playlist_id:' + videoId;
		this.delRedis(redisKey); 
	}
	
	// video by date and content type
	setVideoByDateAndContentType(date, contentType, value, ttl, projectId) {
		let redisKey = projectId + ':video:date:' + date + ':content_type:' + contentType;
		this.setRedis(redisKey, value, ttl);
	}

	getVideoByDateAndContentType(date, contentType, projectId) {
		let redisKey = projectId + ':video:date:' + date + ':content_type:' + contentType;
		return this.getRedis(redisKey);
	}

	delVideoByDateAndContentType(date, contentType, projectId) {
		let redisKey = projectId + ':video:date:' + date + ':content_type:' + contentType;
		this.delRedis(redisKey);
	}

	/* VIDEO QUALITIES */
	//all
	setVideoQualities(value, ttl, projectId) {
		let redisKey = projectId + ':video_quality:all';
		this.setRedis(redisKey, value, ttl);
	}

	getVideoQualities(projectId) {
		let redisKey = projectId + ':video_quality:all';
		return this.getRedis(redisKey);
	}

	delVideoQualities(projectId) {
		let redisKey = projectId + ':video_quality:all';
		this.delRedis(redisKey); 
	}

	// by ID
	setVideoQualityById(videoQualityId, value, ttl, projectId) {
		let redisKey = projectId + ':video_quality:id:' + videoQualityId;
		this.setRedis(redisKey, value, ttl);
	}
	
	getVideoQualityById(videoQualityId, projectId) {
		let redisKey = projectId + ':video_quality:id:' + videoQualityId;
		return this.getRedis(redisKey);
	}

	delVideoQualityById(videoQualityId, projectId) {
		let redisKey = projectId + ':video_quality:id:' + videoQualityId;
		this.delRedis(redisKey); 
	}
	
	/* PLAYLIST */
	// all playlists
	setAllPlaylistIds(value, ttl, projectId) {
		let redisKey = projectId + ':playlist:all';
		this.setRedis(redisKey, value, ttl);
	}

	getAllPlaylistIds(projectId) {
		let redisKey = projectId + ':playlist:all';
		return this.getRedis(redisKey);
	}

	delAllPlaylistIds(projectId) {
		let redisKey = projectId + ':playlist:all';
		this.delRedis(redisKey); 
	}

	// playlist by ID
	setPlaylistById(playlistId, value, ttl, projectId) {
		let redisKey = projectId + ':playlist:id:' + playlistId;
		this.setRedis(redisKey, value, ttl);
	}

	getPlaylistById(playlistId, projectId) {
		let redisKey = projectId + ':playlist:id:' + playlistId;
		return this.getRedis(redisKey);
	}

	delPlaylistById(playlistId, projectId) {
		let redisKey = projectId + ':playlist:id:' + playlistId;
		this.delRedis(redisKey); 
	}

	// playlist IDs by video ID
	setPlaylistIdsByVideoId(videoId, value, ttl, projectId) {
		let redisKey = projectId + ':playlist_ids:video_id:' + videoId;
		this.setRedis(redisKey, value, ttl);
	}

	getPlaylistIdsByVideoId(videoId, projectId) {
		let redisKey = projectId + ':playlist_ids:video_id:' + videoId;
		return this.getRedis(redisKey);
	}

	delPlaylistIdsByVideoId(videoId, projectId) {
		let redisKey = projectId + ':playlist_ids:video_id:' + videoId;
		this.delRedis(redisKey); 
	}
	
	// playlist IDs by content type
	setPlaylistIdsByContentType(contentType, value, ttl, projectId) {
		let redisKey = projectId + ':playlist_ids:content_type:' + contentType;
		this.setRedis(redisKey, value, ttl);
	}

	getPlaylistIdsByContentType(contentType, projectId) {
		let redisKey = projectId + ':playlist_ids:content_type:' + contentType;
		return this.getRedis(redisKey);
	}

	delPlaylistIdsByContentType(contentType, projectId) {
		let redisKey = projectId + ':playlist_ids:content_type:' + contentType;
		this.delRedis(redisKey);
	}

	// subplaylist
	setSubplaylistIds(playlistId, value, ttl, projectId) {
		let redisKey = projectId + ':subplaylist:id:' + playlistId;
		this.setRedis(redisKey, value, ttl);
	}

	getSubplaylistIds(playlistId, projectId) {
		let redisKey = projectId + ':subplaylist:id:' + playlistId;
		return this.getRedis(redisKey);
	}

	delSubplaylistIds(playlistId, projectId) {
		let redisKey = projectId + ':subplaylist:id:' + playlistId;
		this.delRedis(redisKey); 
	}

	/* TEAM */
	// team by ID
	setTeamById(teamId, value, ttl, projectId) {
		let redisKey = projectId + ':team:id:' + teamId;
		this.setRedis(redisKey, value, ttl);
	}

	getTeamById(teamId, projectId) {
		let redisKey = projectId + ':team:id:' + teamId;
		return this.getRedis(redisKey);
	}

	delTeamById(teamId, projectId) {
		let redisKey = projectId + ':team:id:' + teamId;
		this.delRedis(redisKey); 
	}

	/* RELATED ARTICLE */
	setRelatedArticleIds(videoId, value, ttl, projectId) {
		let redisKey = projectId + ':related_article:id:' + videoId;
		this.setRedis(redisKey, value, ttl);
	}

	getRelatedArticleIds(videoId, projectId) {
		let redisKey = projectId + ':related_article:id:' + videoId;
		return this.getRedis(redisKey);
	}

	delRelatedArticleIds(videoId, projectId) {
		let redisKey = projectId + ':related_article:id:' + videoId;
		this.delRedis(redisKey); 
	}

	/* CONTENT TYPE */
	setContentTypeById(typeId, value, ttl, projectId) {
		let redisKey = projectId + ':content_type:id:' + typeId;
		this.setRedis(redisKey, value, ttl);
	}

	getContentTypeById(typeId, projectId) {
		let redisKey = projectId + ':content_type:id:' + typeId;
		return this.getRedis(redisKey);
	}

	delContentTypeById(typeId, projectId) {
		let redisKey = projectId + ':content_type:id:' + typeId;
		this.delRedis(redisKey); 
	}  
	
	/* SCHEDULE */
	setScheduleById(scheduleId, value, ttl, projectId) {
		let redisKey = projectId + ':schedule:id:' + scheduleId;
		this.setRedis(redisKey, value, ttl);
	}

	getScheduleById(scheduleId, projectId) {
		let redisKey = projectId + ':schedule:id:' + scheduleId;
		return this.getRedis(redisKey);
	}

	delScheduleById(scheduleId, projectId) {
		let redisKey = projectId + ':schedule:id:' + scheduleId;
		this.delRedis(redisKey); 
	}

	setScheduleIdsByDateAndPlaylistId(date, playlistId, value, ttl, projectId) {
		let redisKey = projectId + ':schedule_ids:date:' + date + ':playlist_id:' + playlistId;
		this.setRedis(redisKey, value, ttl);
	}

	getScheduleIdsByDateAndPlaylistId(date, playlistId, projectId) {
		let redisKey = projectId + ':schedule_ids:date:' + date + ':playlist_id:' + playlistId;
		return this.getRedis(redisKey);
	}

	delScheduleIdsByDateAndPlaylistId(date, playlistId, projectId) {
		let redisKey = projectId + ':schedule_ids:date:' + date + ':playlist_id:' + playlistId;
		this.delRedis(redisKey);
	}
	
	/* SUBSCRIPTION TOGGLE */
	// control whether to check user subscription (value = 1) or allow access to all videos (value = 0)
	setSubscriptionToggle(value, projectId) {
		let redisKey = projectId + ':subscription:toggle';
		this.setRedis(redisKey, value, null);
	}

	getSubscriptionToggle(projectId) {
		let redisKey = projectId + ':subscription:toggle';
		return this.getRedis(redisKey);
	}

	delSubscriptionToggle(projectId) {
		let redisKey = projectId + ':subscription:toggle';
		this.delRedis(redisKey);
	}

	/* VIDEO ADS */
	// temporary: only 1 video ads
	setAd(value, ttl, projectId) {
		let redisKey = projectId + ':ad';
		this.setRedis(redisKey, value, ttl);
	}

	getAd(projectId) {
		let redisKey = projectId + ':ad';
		return this.getRedis(redisKey);
	}

	delAd(projectId) {
		let redisKey = projectId + ':ad';
		this.delRedis(redisKey);
	}

	// ad by ID
	setAdById(adId, value, ttl, projectId) {
		let redisKey = projectId + ':ad:id:' + adId;
		this.setRedis(redisKey, value, ttl);
	}

	getAdById(adId, projectId) {
		let redisKey = projectId + ':ad:id:' + adId;
		return this.getRedis(redisKey);
	}

	delAdById(adId, projectId) {
		let redisKey = projectId + ':ad:id:' + adId;
		this.delRedis(redisKey);
	}
}

module.exports = Redis;
