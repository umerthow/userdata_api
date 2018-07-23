/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('playlist_videos', {
		playlist_id: {
			type: DataTypes.CHAR(10),
			allowNull: false,
			primaryKey: true,
			references: {
				model: 'playlists',
				key: 'id'
			}
		},
		video_id: {
			type: DataTypes.CHAR(10),
			allowNull: false,
			primaryKey: true,
			references: {
				model: 'videos',
				key: 'id'
			}
		},
		status: {
			type: DataTypes.INTEGER(1),
			allowNull: false,
			defaultValue: '1'
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false
		},
		updated_at: {
			type: DataTypes.DATE,
			allowNull: true
		},
		deleted_at: {
			type: DataTypes.DATE,
			allowNull: true
		},
		project_id: {
			type: DataTypes.CHAR(20),
			allowNull: true
		}
	}, {
		tableName: 'playlist_videos',
		timestamps: true,
		paranoid: true,
		underscored: true
	})
}
