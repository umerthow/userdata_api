/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('video_ads', {
		id: {
			type: DataTypes.INTEGER(8).UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		title: {
			type: DataTypes.CHAR(100),
			allowNull: false
		},
		url: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		duration: {
			type: DataTypes.CHAR(10),
			allowNull: false
		},
		skip_offset: {
			type: DataTypes.CHAR(10),
			allowNull: true
		},
		type: {
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
		project_id: {
			type: DataTypes.CHAR(20),
			allowNull: true
		}
	}, {
		tableName: 'video_ads',
		timestamps: true,
		paranoid: true,
		underscored: true
	})
}
