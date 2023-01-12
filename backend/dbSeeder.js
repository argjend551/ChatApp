const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection(
      require('./secrets/dbCredentials.json')
    );

    await connection.query('DROP TABLE IF EXISTS users');
    console.log('Users table dropped');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL
      )
    `);

    console.log('Users table created');

    console.log('Messages table created');

    await connection.query('DROP TABLE IF EXISTS messages');
    console.log('Messages table dropped');

    await connection.query('DROP TABLE IF EXISTS rooms');
    console.log('rooms table dropped');

    console.log('rooms table created');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        room_id VARCHAR(255) PRIMARY KEY,
        roomName VARCHAR(255) NOT NULL,
        moderator VARCHAR(255) NOT NULL,
        members VARCHAR(255)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        message_id VARCHAR(255) PRIMARY KEY,
        sender VARCHAR(255) NOT NULL,
        room_id VARCHAR(255) NOT NULL,
        message VARCHAR(255) NOT NULL,
        date DATETIME NOT NULL,
        FOREIGN KEY (sender) REFERENCES users(user_id),
        FOREIGN KEY (room_id) REFERENCES rooms(room_id)
      )
    `);
    console.log('Messages table created');

    // End the database connection
    await connection.end();
  } catch (error) {
    console.error(error);
  }
})();
