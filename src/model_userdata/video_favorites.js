/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('video_favorites', {
		id: {
			type: DataTypes.INTEGER(11).UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		uid: {
			type: DataTypes.INTEGER(11),
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
		video_id: {
			type: DataTypes.CHAR(50),
			allowNull: true
		}
	}, {
		tableName: 'video_favorites',
		timestamps: true,
		paranoid: true,
		underscored: true
	})
}
