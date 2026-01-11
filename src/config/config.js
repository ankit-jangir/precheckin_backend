require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT
  }
};


// {
//   "development": {
//     "username": "root",
//     "password": "1234",
//     "database": "precheckin",
//     "host": "127.0.0.1",
//     "dialect": "mysql"
//   },
//   "test": {
//     "username": "root",
//     "password": "1234",
//     "database": "precheckin_test",
//     "host": "127.0.0.1",
//     "dialect": "mysql"
//   },
//   "production": {
//     "username": "root",
//     "password": "1234",
//     "database": "precheckin_prod",
//     "host": "127.0.0.1",
//     "dialect": "mysql"
//   }
// }

