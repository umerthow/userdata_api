/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('banners', {
		id: {
			type: DataTypes.INTEGER(11).UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING(200),
			allowNull: true
		},
		height: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		width: {
			type: DataTypes.INTEGER(11),
			allowNull: false
		},
		type: {
			type: DataTypes.INTEGER(11),
			allowNull: true
		},
		order: {
			type: DataTypes.INTEGER(11),
			allowNull: true
		},
		dismissable: {
			type: DataTypes.INTEGER(1),
			allowNull: true
		},
		visibility: {
			type: DataTypes.INTEGER(4),
			allowNull: true
		},
		img_url: {
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
		link: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		start_time: {
			type: DataTypes.DATE,
			allowNull: true
		},
		end_time: {
			type: DataTypes.DATE,
			allowNull: true
		},
		project_id: {
			type: DataTypes.CHAR(200),
			allowNull: true
		}
	}, {
		tableName: 'banners',
		timestamps: true,
		paranoid: true,
		underscored: true
	})
}
