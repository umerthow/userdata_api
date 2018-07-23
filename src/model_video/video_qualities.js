/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('video_qualities', {
		id: {
			type: DataTypes.INTEGER(8).UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		title: {
			type: DataTypes.CHAR(20),
			allowNull: false
		},
		bitrate: {
			type: DataTypes.CHAR(20),
			allowNull: false
		},
		width: {
			type: DataTypes.INTEGER(8),
			allowNull: false
		},
		height: {
			type: DataTypes.INTEGER(8),
			allowNull: false
		},
		priority: {
			type: DataTypes.INTEGER(8),
			allowNull: false
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
		}
	}, {
		tableName: 'video_qualities',
		timestamps: true,
		paranoid: true,
		underscored: true
	})
}
