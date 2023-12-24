const app = require('./src/app.js');
const pool = require('./src/pool');

require('dotenv').config();

pool
  .connect({
    host: 'localhost',
    port: 5432,
    database: process.env.DB_NAME, 
    user:  process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  })
  .then(() => {
    app().listen(3005, () => {
      console.log('Listening on port 3005');
    });
  })
  .catch((err) => console.error(err));
