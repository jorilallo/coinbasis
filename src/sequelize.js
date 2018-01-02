import Sequelize from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL);

export default sequelize;
