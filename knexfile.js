// Knex configuration for Appwrite MariaDB integration
require("dotenv").config();

module.exports = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.APPWRITE_ENDPOINT,

      //   host: process.env.APPWRITE_DB_HOST || "localhost",
      //   user: process.env.APPWRITE_DB_USER || "root",
      //   password: process.env.APPWRITE_DB_PASSWORD || "",
      database: process.env.APPWRITE_DB_NAME || "appwrite",
      //   port: process.env.APPWRITE_DB_PORT || 3306,
      charset: "utf8mb4",
    },
    useNullAsDefault: true,
    migrations: {
      directory: __dirname + "/db/migrations",
    },
    seeds: {
      directory: __dirname + "/db/seeds",
    },
  },

  staging: {
    client: "mysql2",
    connection: {
      host: process.env.APPWRITE_ENDPOINT,
      // user: process.env.APPWRITE_DB_USER,
      // password: process.env.APPWRITE_DB_PASSWORD,
      database: process.env.APPWRITE_DB_NAME,
      // port: process.env.APPWRITE_DB_PORT || 3306,
      charset: "utf8mb4",
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: __dirname + "/db/migrations",
    },
    seeds: {
      directory: __dirname + "/db/seeds",
    },
  },

  production: {
    client: "mysql2",
    connection: {
      host: process.env.APPWRITE_ENDPOINT,
      //   user: process.env.APPWRITE_DB_USER,
      //   password: process.env.APPWRITE_DB_PASSWORD,
      database: process.env.APPWRITE_DB_NAME,
      //   port: process.env.APPWRITE_DB_PORT || 3306,
      charset: "utf8mb4",
    },
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      directory: __dirname + "/db/migrations",
    },
    seeds: {
      directory: __dirname + "/db/seeds",
    },
  },
};
