import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: '127.0.0.1',
  database: 'nodejs-users',
  user: 'root',
  password: 'citaku1',
  port: '3306',
});

export const isUserInRoom = async (roomId, userId) => {
  console.log(roomId, userId);
  const results = await db.query(
    'SELECT * FROM rooms WHERE (moderator = ? OR members = ?) AND room_id = ?',
    [userId, userId, roomId]
  );
  return results[0];
};
