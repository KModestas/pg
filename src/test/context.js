const { randomBytes } = require('crypto');
const format = require('pg-format');
const { default: migrate } = require('node-pg-migrate');
const pool = require('../pool');

const DEFAULT_OPTS = {
  host: 'localhost',
  port: 5432,
  database: process.env.DB_NAME,
  user:  process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

class Context {
  static async build() {
    // Randomly generating a role name to connect to PG as
    // roles in pg must start with a letter
    const roleName = 'a' + randomBytes(4).toString('hex');

    // Connect to PG as usual
    await pool.connect(DEFAULT_OPTS);

  // Create a new role (no need to worry about SQL injections in test env)
    await pool.query(`
      CREATE ROLE ${roleName} WITH LOGIN PASSWORD '${roleName}';
    `);

  // Create a schema with the same name
  await pool.query(`
    CREATE SCHEMA ${roleName} AUTHORIZATION ${roleName};
  `);

    // Disconnect entirely from PG
    await pool.close();

    // Run our migrations in the new schema (create the table)
    await migrate({
      schema: roleName,
      direction: 'up',
      log: () => {},
      noLock: true,
      dir: 'migrations',
      databaseUrl: {
        host: 'localhost',
        port: 5432,
        database: process.env.DB_NAME,
        user: roleName,
        password: roleName,
      },
    });

    // Connect to PG as the newly created role
    await pool.connect({
      host: 'localhost',
      port: 5432,
      database: process.env.DB_NAME,
      user: roleName,
      password: roleName,
    });

    return new Context(roleName);
  }

  constructor(roleName) {
    this.roleName = roleName;
  }

  async close() {
    // Disconnect from PG
    await pool.close();

    // Reconnect as our root user (cannot delete a role if you are connected as that role)
    await pool.connect(DEFAULT_OPTS);

    // Delete the role and schema we created
    await pool.query(format('DROP SCHEMA %I CASCADE;', this.roleName));
    await pool.query(format('DROP ROLE %I;', this.roleName));

    // Disconnect
    await pool.close();
  }
}

module.exports = Context;
