require('dotenv').config();

const base = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './src/migrations',
  },
  seeds: {
    directory: './src/seeds',
  },
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
