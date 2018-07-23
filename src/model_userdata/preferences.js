/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('preferences', {
		id: {
			type: DataTypes.INTEGER(11).UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
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
		uid: {
			type: DataTypes.STRING(100),
			allowNull: false
		},
		language: {
			type: DataTypes.INTEGER(11),
			allowNull: true
		}
	}, {
		tableName: 'preferences',
		timestamps: true,
		paranoid: true,
		underscored: true
	})
}
