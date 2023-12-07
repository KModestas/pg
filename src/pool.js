const pg = require('pg');

class Pool {
  _pool = null;

  // wrapping up our pg client in a Class allows us to easily connect with different settings (for the test environment)
  connect(options) {
    this._pool = new pg.Pool(options);
    // test wether our connection credentials are valid by immediately running a simple query
    return this._pool.query('SELECT 1 + 1;');
  }

  close() {
    return this._pool.end();
  }

  query(sql, params) {
    return this._pool.query(sql, params);
  }
}

module.exports = new Pool();
