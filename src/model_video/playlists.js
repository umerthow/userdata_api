/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('playlists', {
		id: {
			type: DataTypes.CHAR(10),
			allowNull: false,
			primaryKey: true
		},
		title: {
			type: DataTypes.CHAR(100),
			allowNull: false
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		visibility: {
			type: DataTypes.INTEGER(8).UNSIGNED,
			allowNull: false,
			defaultValue: '0'
		},
		content_type: {
			type: DataTypes.INTEGER(8).UNSIGNED,
			allowNull: false,
			references: {
				model: 'content_types',
				key: 'id'
			}
		},
		country_code: {
			type: DataTypes.CHAR(2),
			allowNull: true
		},
		cover_url: {
			type: DataTypes.STRING(300),
			allowNull: true
		},
		icon_url: {
			type: DataTypes.STRING(300),
			allowNull: true
		},
		sort_order: {
			type: DataTypes.INTEGER(8),
			allowNull: false,
			defaultValue: '0'
		},
		parent_id: {
			type: DataTypes.STRING(255),
			allowNull: true
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
		tableName: 'playlists',
		timestamps: true,
		paranoid: true,
		underscored: true
	})
}
