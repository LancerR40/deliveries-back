import mysql from "mysql";
import { promisify } from "util";

const database = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: { rejectUnauthorized: false }
});

database.getConnection((err, connection) => {
  if (err) {
    throw new Error(err);
  }

  if (connection) {
    connection.release();
  }
});

export default promisify(database.query).bind(database);
