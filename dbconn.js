const mysql = require('mysql2/promise');
require('dotenv').config();
const {
  BASE_HOST, BASE_USER, BASE_NAME, BASE_PASSWORD,
} = require('./utils/variables');

const pool = mysql.createPool({
  connectionLimit: 5,
  host: BASE_HOST,
  user: BASE_USER,
  database: BASE_NAME,
  password: BASE_PASSWORD,
});

module.exports = pool;
