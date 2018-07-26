/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('custom_playlists_details', {
		id: {
			type: DataTypes.INTEGER(11).UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		playlist_name: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		uid: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		project_id: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		is_private: {
			type: DataTypes.INTEGER(1),
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
		}
	}, {
		tableName: 'custom_playlists_details',
		timestamps: true,
		paranoid: true,
		underscored: true
	})
}
