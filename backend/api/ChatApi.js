const uuid = require('uuid');
const acl = require('../acl');
const mysql = require('mysql2/promise');
const NotLoggedInException = require('../api/exceptions/NotLoggedInException');
const NotAllowedException = require('../api/exceptions/NotAllowedException');
const InvalidInputException = require('../api/exceptions/InvalidInputException');

const { resolveEnvPrefix } = require('vite');

module.exports = class ChatApi {
  connections = [];

  db = mysql.createPool(require('../secrets/dbCredentials.json'));

  constructor(expressapp) {
    this.app = expressapp;
    this.start();
  }

  start() {
    this.app.get('/api/sse/:roomId', async (req, res, next) => {
      try {
        const clientId = req.session.user.user_id;
        const roomId = req.params.roomId;

        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        // Check if the user is a member of the room
        const results = await this.db.query(
          'SELECT * FROM rooms WHERE moderator = ? AND room_id = ?',
          [clientId, roomId]
        );

        if (results[0].length > 0) {
          // Remove any existing connections belonging to the user
          this.connections = this.connections.filter(
            (connection) => connection.id !== clientId
          );

          // Add the new connection
          this.connections.push({
            id: clientId,
            res,
            roomId: roomId,
          });

          req.on('close', () => {
            this.connections = this.connections[0].filter(
              (connection) => connection.id !== clientId
            );

            this.broadcast('disconnect', {
              message: 'client disconnected',
            });
          });

          res.set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
          });

          this.broadcast('connect', {
            message: 'clients connected: ' + this.connections.length,
          });
        } else {
          // The user is not a member of the room, so send an error response
          res.status(403).send({
            error: 'User is not a member of the room',
          });
        }
      } catch (err) {
        next();
      }
    });

    this.app.get('/api/rooms', async (req, res, next) => {
      try {
        const clientId = req.session.user.user_id;

        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        const rooms = await this.db.query(
          `SELECT * FROM rooms WHERE moderator = ?`,
          [clientId]
        );

        const roomDTO = rooms[0].map((room) => ({
          roomName: room.roomName,
          roomId: room.room_id,
        }));

        res.json(roomDTO);
      } catch (error) {
        next(error);
      }
    });

    this.app.post('/api/createRoom', async (req, res, next) => {
      try {
        const clientId = req.session.user.user_id;

        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        const roomName = req.body.roomName;
        if (!roomName || typeof roomName !== 'string') {
          throw new InvalidInputException(
            'Please provide a valid room name',
            400
          );
        }

        const roomId = uuid.v4();

        await this.db.query(
          'INSERT INTO rooms (room_id, roomName, moderator) VALUES (?, ?, ?)',
          [roomId, roomName, clientId]
        );

        res.send({ roomName: roomName, roomId: roomId });
      } catch (error) {
        next(error);
      }
    });

    this.app.post('/api/send-message-to-room', async (req, res, next) => {
      try {
        const { roomId, message } = req.body;

        const clientId = req.session.user.user_id;

        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        // Check if the user is a member of the room
        const [results] = await this.db.query(
          'SELECT * FROM rooms WHERE moderator = ? AND room_id = ?',
          [clientId, roomId]
        );

        if (!results.length) {
          throw new NotAllowedException(
            'User is not a member of the room',
            403
          );
        }

        // The user is a member of the room, so send the message
        const userConnected = await this.sendMessage(roomId, message, clientId);

        if (!userConnected) {
          return res.status(403).send({
            error: 'User is not connected to the room',
          });
        }
        const messageId = uuid.v4();

        // Save the message in the database
        await this.db.query(
          'INSERT INTO messages (message_id, sender, room_id, message, date) VALUES (?, ?, ?, ?, ?)',
          [messageId, clientId, roomId, message, new Date()]
        );

        res.send({ message: 'Message sent to room' });
      } catch (error) {
        next();
      }
    });

    this.app.get('/api/getAllMessages', async (req, res, next) => {
      const clientId = req.session.user.user_id;

      if (!clientId) {
        throw new NotLoggedInException('User is not logged in', 401);
      }

      // Find all connections belonging to the room
      const roomConnections = this.connections.find(
        (connection) => connection.id === clientId
      );

      if (!roomConnections) {
        return;
      }

      // The user is connected to the room, so fetch the messages from the database
      const room = await this.db.query(
        'SELECT * FROM rooms WHERE moderator = ? AND room_id = ?',
        [clientId, roomConnections.roomId]
      );

      if (!room[0].length) {
        return res.status(403).send({
          error: 'User is not a member of the room',
        });
      }

      const messages = await this.db.query(
        'SELECT * FROM messages WHERE room_id = ? ORDER BY date',
        [roomConnections.roomId]
      );

      const messageDTO = await Promise.all(
        messages[0].map(async (message) => {
          const username = await this.getUsernameFromUserId(message.sender);
          const date = await this.formatDate(message.date);
          return {
            message: message.message,
            sender: username,
            date: date,
            sentByMe: message.sender === clientId,
          };
        })
      );

      res.send(messageDTO);
    });

    this.app.post('/api/inviteToRoom', async (req, res, next) => {
      try {
        const roomId = req.body.roomId;
        const invitedMembers = req.body.invitedMembers; // array of member ids

        // Check if the room exists
        const findRoom = await this.db.query(
          'SELECT * From rooms  WHERE room_id = ?',
          [roomId]
        );

        if (findRoom) {
          throw new NotAllowedException('Room does not exist', 404);
        }

        // // Send an SSE event to the invited members
        // sseInstance.send(invitedMembers, 'invitation', room);

        res.send({ message: 'Invitations sent successfully' });
      } catch (error) {
        next(error);
      }
    });
  }

  broadcast(event, data) {
    console.log(event);
    for (let connection of this.connections) {
      connection.res.write(
        'event:' + event + '\ndata:' + JSON.stringify(data) + '\n\n'
      );
    }
  }

  async sendMessage(roomId, message, clientId) {
    // Find all connections belonging to the room
    const roomConnections = this.connections.filter(
      (connection) => connection.roomId === roomId
    );

    // Check if the user is connected to the room
    const userConnected = roomConnections.some(
      (connection) => connection.id === clientId
    );

    if (userConnected) {
      // Write the message to all connections belonging to the room
      const time = new Date();
      for (let connection of roomConnections) {
        const sendMessage = {
          message: message,
          sender: await this.getUsernameFromUserId(clientId),
          date: await this.formatDate(time),
          sentByMe: connection.id === clientId,
        };
        connection.res.write(
          'event: new-room-message\ndata:' +
            JSON.stringify(sendMessage) +
            '\n\n'
        );
      }
      return true;
    } else {
      return false;
    }
  }

  async getUsernameFromUserId(userId) {
    const [results] = await this.db.query(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );
    if (!results.length) {
      return null;
    }
    return results[0].email;
  }

  async formatDate(date) {
    const today = new Date();
    if (
      today.toDateString() === date.toDateString() &&
      date.getHours() === 0 &&
      date.getMinutes() === 0 &&
      date.getSeconds() === 0
    ) {
      return (
        date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear()
      );
    } else if (today.toDateString() === date.toDateString()) {
      return date.toLocaleTimeString();
    } else {
      return date.toLocaleString();
    }
  }
};
