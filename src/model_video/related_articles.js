/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('related_articles', {
		video_id: {
			type: DataTypes.CHAR(10),
			allowNull: false,
			primaryKey: true,
			references: {
				model: 'videos',
				key: 'id'
			}
		},
		article_id: {
			type: DataTypes.INTEGER(8).UNSIGNED,
			allowNull: false,
			primaryKey: true
		},
		status: {
			type: DataTypes.INTEGER(1),
			allowNull: false,
			defaultValue: '1',
			primaryKey: true
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false
		},
		updated_at: {
			type: DataTypes.DATE,
			allowNull: true
		}
	}, {
		tableName: 'related_articles',
		timestamps: true,
		paranoid: true,
		underscored: true
	})
}
