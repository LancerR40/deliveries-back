import mysql from "mysql";
import { promisify } from "util";

const database = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: process.env.DATABASE_PORT,
});

database.getConnection((err, connection) => {
  if (err) {
    throw new Error(err);
  }

  if (connection) {
    connection.release();

    console.log("Database connected");
  }
});

export default promisify(database.query).bind(database);
