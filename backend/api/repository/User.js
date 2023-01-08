import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: '127.0.0.1',
  database: 'nodejs-users',
  user: 'root',
  password: 'citaku1',
  port: '3306',
});

export const getUserByEmail = async (email) => {
  const result = await db.query(`SELECT * FROM users WHERE email = ?`, [email]);
  return result[0][0];
};

export const createUser = async (id, email, password, name, role) => {
  await db.query(
    `INSERT INTO users (user_id, email, password, name, role) VALUES (?, ?, ?, ?, ?)`,
    [id, email, password, name, role]
  );
};

export const getAllUsers = async (id) => {
  const result = await db.query(`SELECT * FROM users WHERE user_id != ?`, [id]);
  return result[0];
};
