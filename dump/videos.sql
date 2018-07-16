# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 127.0.0.1 (MySQL 5.7.22)
# Database: video-superset
# Generation Time: 2018-06-25 08:07:13 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table app_permissions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `app_permissions`;

CREATE TABLE `app_permissions` (
  `id` int(8) unsigned NOT NULL AUTO_INCREMENT,
  `app_id` varchar(30) DEFAULT NULL,
  `playlist_id` varchar(300) DEFAULT NULL,
  `status` int(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index_app_permission_app_id` (`app_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table content_types
# ------------------------------------------------------------

DROP TABLE IF EXISTS `content_types`;

CREATE TABLE `content_types` (
  `id` int(8) unsigned NOT NULL AUTO_INCREMENT,
  `name` char(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table logs
# ------------------------------------------------------------

DROP TABLE IF EXISTS `logs`;

CREATE TABLE `logs` (
  `id` int(8) unsigned NOT NULL AUTO_INCREMENT,
  `uid` char(10) NOT NULL,
  `scope` char(50) NOT NULL,
  `payload` text NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table playlist_videos
# ------------------------------------------------------------

DROP TABLE IF EXISTS `playlist_videos`;

CREATE TABLE `playlist_videos` (
  `playlist_id` char(10) NOT NULL,
  `video_id` char(10) NOT NULL,
  `status` int(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `project_id` char(20) DEFAULT NULL,
  PRIMARY KEY (`playlist_id`,`video_id`),
  KEY `fk_playlist_video_video_id` (`video_id`),
  CONSTRAINT `fk_playlist_video_playlist_id` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`),
  CONSTRAINT `fk_playlist_video_video_id` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table playlists
# ------------------------------------------------------------

DROP TABLE IF EXISTS `playlists`;

CREATE TABLE `playlists` (
  `id` char(10) NOT NULL,
  `title` char(100) NOT NULL,
  `description` text,
  `visibility` int(8) unsigned NOT NULL DEFAULT '0',
  `content_type` int(8) unsigned NOT NULL,
  `country_code` char(2) DEFAULT NULL,
  `cover_url` varchar(300) DEFAULT NULL,
  `icon_url` varchar(300) DEFAULT NULL,
  `sort_order` int(8) NOT NULL DEFAULT '0',
  `parent_id` varchar(255) DEFAULT NULL,
  `status` int(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `project_id` char(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index_playlist_parent_id` (`parent_id`) USING BTREE,
  KEY `fk_playlist_content_type` (`content_type`),
  CONSTRAINT `fk_playlist_content_type` FOREIGN KEY (`content_type`) REFERENCES `content_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table related_articles
# ------------------------------------------------------------

DROP TABLE IF EXISTS `related_articles`;

CREATE TABLE `related_articles` (
  `video_id` char(10) NOT NULL,
  `article_id` int(8) unsigned NOT NULL,
  `status` int(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`video_id`,`article_id`,`status`),
  CONSTRAINT `fk_related_article_video_id` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table schedules
# ------------------------------------------------------------

DROP TABLE IF EXISTS `schedules`;

CREATE TABLE `schedules` (
  `id` int(8) unsigned NOT NULL AUTO_INCREMENT,
  `title` text NOT NULL,
  `start` datetime DEFAULT NULL,
  `end` datetime DEFAULT NULL,
  `description` text,
  `playlist_id` char(10) DEFAULT NULL,
  `video_id` char(10) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `project_id` char(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_schedule_playlist_id` (`playlist_id`),
  KEY `fk_schedule_video_id` (`video_id`),
  CONSTRAINT `fk_schedule_playlist_id` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`),
  CONSTRAINT `fk_schedule_video_id` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table teams
# ------------------------------------------------------------

DROP TABLE IF EXISTS `teams`;

CREATE TABLE `teams` (
  `id` int(8) unsigned NOT NULL AUTO_INCREMENT,
  `name` char(50) NOT NULL,
  `nickname` varchar(50) NOT NULL,
  `official_website_url` varchar(300) DEFAULT NULL,
  `home` char(50) DEFAULT NULL,
  `home_website_url` varchar(300) DEFAULT NULL,
  `origins` varchar(50) DEFAULT NULL,
  `sponsors` varchar(500) DEFAULT NULL,
  `owner` varchar(200) DEFAULT NULL,
  `managers` varchar(200) DEFAULT NULL,
  `coaches` varchar(200) DEFAULT NULL,
  `players` varchar(1000) DEFAULT NULL,
  `birthdate` date NOT NULL,
  `logo` varchar(300) DEFAULT NULL,
  `status` int(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table video_ads
# ------------------------------------------------------------

DROP TABLE IF EXISTS `video_ads`;

CREATE TABLE `video_ads` (
  `id` int(8) unsigned NOT NULL AUTO_INCREMENT,
  `title` char(100) NOT NULL,
  `url` text NOT NULL,
  `duration` char(10) NOT NULL,
  `skip_offset` char(10) DEFAULT NULL,
  `type` char(20) NOT NULL,
  `bitrate` char(20) NOT NULL,
  `width` int(8) NOT NULL,
  `height` int(8) NOT NULL,
  `status` int(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `project_id` char(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table video_qualities
# ------------------------------------------------------------

DROP TABLE IF EXISTS `video_qualities`;

CREATE TABLE `video_qualities` (
  `id` int(8) unsigned NOT NULL AUTO_INCREMENT,
  `title` char(20) NOT NULL,
  `bitrate` char(20) NOT NULL,
  `width` int(8) NOT NULL,
  `height` int(8) NOT NULL,
  `priority` int(8) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table videos
# ------------------------------------------------------------

DROP TABLE IF EXISTS `videos`;

CREATE TABLE `videos` (
  `id` char(10) NOT NULL,
  `title` char(100) NOT NULL,
  `description` text,
  `short_description` text,
  `full_description` text,
  `home_team_id` int(8) unsigned DEFAULT NULL,
  `away_team_id` int(8) unsigned DEFAULT NULL,
  `visibility` int(8) unsigned NOT NULL DEFAULT '0',
  `permission` int(8) unsigned NOT NULL DEFAULT '1',
  `content_type` int(8) unsigned NOT NULL,
  `audio_language` char(2) DEFAULT NULL,
  `subtitle_language` char(2) DEFAULT NULL,
  `views_count` int(10) unsigned DEFAULT NULL,
  `likes_count` int(10) unsigned DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `stream_source_url` varchar(500) DEFAULT NULL,
  `cover_url` varchar(300) DEFAULT NULL,
  `preview_url` varchar(1000) DEFAULT NULL,
  `duration` bigint(20) unsigned DEFAULT NULL,
  `match_start` datetime DEFAULT NULL,
  `match_end` datetime DEFAULT NULL,
  `display_order` int(8) unsigned DEFAULT NULL,
  `players` varchar(2000) DEFAULT NULL,
  `status` int(1) NOT NULL DEFAULT '1',
  `expire_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `drm` int(1) DEFAULT NULL,
  `location` varchar(500) DEFAULT NULL,
  `project_id` char(20) DEFAULT NULL,
  `rating` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_video_home_team` (`home_team_id`),
  KEY `fk_video_away_team` (`away_team_id`),
  KEY `fk_video_content` (`content_type`),
  CONSTRAINT `fk_video_away_team` FOREIGN KEY (`away_team_id`) REFERENCES `teams` (`id`),
  CONSTRAINT `fk_video_content` FOREIGN KEY (`content_type`) REFERENCES `content_types` (`id`),
  CONSTRAINT `fk_video_home_team` FOREIGN KEY (`home_team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
