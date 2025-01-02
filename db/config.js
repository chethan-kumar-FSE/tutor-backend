const mysql = require("mysql2");

const pool = mysql
  .createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })
  .promise();

async function DBConnection() {
  try {
    await pool.connect();
    console.log("successfully connected to mysql-2");
  } catch (err) {
    console.log(err.message);
  }
}

module.exports = { DBConnection, pool };
