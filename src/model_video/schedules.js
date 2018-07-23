/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('schedules', {
		id: {
			type: DataTypes.INTEGER(8).UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		title: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		start: {
			type: DataTypes.DATE,
			allowNull: true
		},
		end: {
			type: DataTypes.DATE,
			allowNull: true
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		playlist_id: {
			type: DataTypes.CHAR(10),
			allowNull: true,
			references: {
				model: 'playlists',
				key: 'id'
			}
		},
		video_id: {
			type: DataTypes.CHAR(10),
			allowNull: true,
			references: {
				model: 'videos',
				key: 'id'
			}
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
		tableName: 'schedules',
		timestamps: true,
		paranoid: true,
		underscored: true
	})
}
