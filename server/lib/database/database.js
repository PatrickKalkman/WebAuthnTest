/*
 * database, the gateway to the database
 */

// Dependencies
import sqlite3 from 'sqlite3';
import log from '../log.js';

const database = {};

database.open = () => {
  database.db = new sqlite3.Database('./db/webauthn.db');
  log.info("Database opened");
}

database.close = () => {
  database.db.close();
};

database.createTables = () => {
  database.db.run('CREATE TABLE IF NOT EXISTS users (username	TEXT NOT NULL, name	TEXT, registered	INTEGER, fmt	TEXT, publicKey	TEXT, credID	TEXT, PRIMARY KEY(username))');
  log.info("Created table users");
}

database.getUser = (username) => {
  return new Promise((resolve, reject) => {
    database.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

database.getUserByCredId = (credID) => {
  return new Promise((resolve, reject) => {
    database.db.get('SELECT * FROM users WHERE credID = ?', [credID], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

database.addUser = (username, name, registered, fmt, publicKey, credID) => {
  return new Promise((resolve, reject) => {
    database.db.run('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)', [username, name, registered, fmt, publicKey, credID], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

database.updateUser = (username, registered, fmt, publicKey, credID) => {
  return new Promise((resolve, reject) => {
    database.db.run('UPDATE users SET registered = ?, fmt = ?, publicKey = ?, credID = ? WHERE username = ?', [registered, fmt, publicKey, credID, username], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
export default database;