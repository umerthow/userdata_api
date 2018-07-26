/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('custom_playlists_videos', {
		id: {
			type: DataTypes.INTEGER(11).UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		video_id: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: true
		},
		updated_at: {
			type: DataTypes.DATE,
			allowNull: true
		},
		deleted_at: {
			type: DataTypes.DATE,
			allowNull: true
		},
		playlist_id: {
			type: DataTypes.INTEGER(11),
			allowNull: true
		}
	}, {
		tableName: 'custom_playlists_videos',
		timestamps: true,
		paranoid: true,
		underscored: true
	})
}
