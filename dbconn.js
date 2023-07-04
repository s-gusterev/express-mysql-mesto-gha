const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  connectionLimit: 5,
  host: 'localhost',
  user: 'root',
  database: 'mesto',
  password: '',
});

module.exports = pool;
