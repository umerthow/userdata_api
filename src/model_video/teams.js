/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('teams', {
		id: {
			type: DataTypes.INTEGER(8).UNSIGNED,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.CHAR(50),
			allowNull: false
		},
		nickname: {
			type: DataTypes.STRING(50),
			allowNull: false
		},
		official_website_url: {
			type: DataTypes.STRING(300),
			allowNull: true
		},
		home: {
			type: DataTypes.CHAR(50),
			allowNull: true
		},
		home_website_url: {
			type: DataTypes.STRING(300),
			allowNull: true
		},
		origins: {
			type: DataTypes.STRING(50),
			allowNull: true
		},
		sponsors: {
			type: DataTypes.STRING(500),
			allowNull: true
		},
		owner: {
			type: DataTypes.STRING(200),
			allowNull: true
		},
		managers: {
			type: DataTypes.STRING(200),
			allowNull: true
		},
		coaches: {
			type: DataTypes.STRING(200),
			allowNull: true
		},
		players: {
			type: DataTypes.STRING(1000),
			allowNull: true
		},
		birthdate: {
			type: DataTypes.DATEONLY,
			allowNull: false
		},
		logo: {
			type: DataTypes.STRING(300),
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
		}
	}, {
		tableName: 'teams',
		timestamps: true,
		paranoid: true,
		underscored: true
	})
}
