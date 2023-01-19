const uuid = require('uuid');
const acl = require('../acl');
const mysql = require('mysql2/promise');
const NotLoggedInException = require('../api/exceptions/NotLoggedInException');
const NotAllowedException = require('../api/exceptions/NotAllowedException');
const InvalidInputException = require('../api/exceptions/InvalidInputException');

module.exports = class ChatApi {
  connections = [];

  db = mysql.createPool(require('../secrets/dbCredentials.json'));

  constructor(expressapp) {
    this.app = expressapp;
    this.start();
  }

  start() {
    this.app.get('/api/sse', (req, res, next) => {
      try {
        res.set({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        // check if the user already has a connection
        const existingConnection = this.connections.find(
          (c) => c.id === req.session.user.user_id
        );

        if (existingConnection) {
          existingConnection.res == null;
        }
        // add the new connection to the array
        this.connections.push({
          id: req.session.user.user_id,
          res: res,
        });
        // Send a message to the client to confirm the connection
        res.write(` Connection established\n\n`);

        res.on('close', () => {
          this.connections = this.connections.filter(
            (c) => c.id !== req.session.user.user_id
          );
        });
      } catch (err) {
        next();
      }
    });

    this.app.get('/api/enterRoom/:roomId', async (req, res, next) => {
      try {
        const clientId = req.session.user.user_id;
        const roomId = req.params.roomId;

        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        const [result] = await this.db.query(
          `SELECT * FROM rooms
            LEFT JOIN roomMembers ON rooms.room_id = roomMembers.room_id
            WHERE (moderator = ? OR roomMembers.member = ?) AND rooms.room_id = ? `,
          [clientId, clientId, roomId]
        );

        if (result.length > 0) {
          // check if the user is a moderator
          const moderator = result.find((x) => x.moderator === clientId);
          // check if the user is a member
          const member = result.find((x) => x.member === clientId);

          if (!moderator.moderatord && member) {
            if (member.banned) {
              res.status(403).send({
                error: 'User is banned from this room',
              });
            }
          }
          // Find the existing connection for the user
          const existingConnection = this.connections.find(
            (c) => c.id === clientId
          );

          if (existingConnection) {
            existingConnection.room = roomId;
            res.send({ moderator: true });
          } else {
            // add the new connection to the array
            this.connections.push({
              id: clientId,
              res: res,
              room: roomId,
            });
            res.send({ moderator: true });
          }
        } else {
          // The user is not a member of the room
          res.status(403).send({
            error: 'User is not a member of the room',
          });
        }
      } catch (err) {
        next(err);
      }
    });

    this.app.get('/api/rooms', async (req, res, next) => {
      try {
        const clientId = req.session.user.user_id;

        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        const rooms = await this.db.query(
          `SELECT * FROM rooms WHERE moderator = ?
            UNION
            SELECT rooms.* FROM rooms, roommembers WHERE rooms.room_id = roommembers.room_id AND roommembers.member = ?
`,
          [clientId, clientId]
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

    this.app.post('/api/sendMessage', async (req, res, next) => {
      try {
        const clientId = req.session.user.user_id;
        const roomId = req.body.roomId;
        const message = req.body.message;

        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        // check if the user is a member of the room
        const results = await this.db.query(
          `SELECT * FROM rooms
          LEFT JOIN roommembers ON rooms.room_id = roommembers.room_id
          WHERE (moderator = ? OR roommembers.member = ?) AND rooms.room_id = ?`,
          [clientId, clientId, roomId]
        );
        if (!results[0].length) {
          throw new NotAllowedException(
            'User is not a member of the room',
            403
          );
        }

        const checkBan = results[0].find((x) => x.member === clientId);

        // Check if the user is banned
        if (checkBan && checkBan.banned) {
          throw new NotAllowedException('User is banned from this room', 403);
        }

        this.sendMessage(clientId, roomId, message);
        const messageId = uuid.v4();

        // Save the message in the database
        await this.db.query(
          'INSERT INTO messages (message_id, sender, room_id, message, date) VALUES (?, ?, ?, ?, ?)',
          [messageId, clientId, roomId, message, new Date()]
        );

        res.send({ message: 'Message sent to room' });
      } catch (err) {
        next(err);
      }
    });

    this.app.get('/api/getAllMessages', async (req, res, next) => {
      try {
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
          `SELECT * FROM rooms 
         WHERE moderator = ? AND room_id = ?
            UNION
            SELECT rooms.* FROM rooms
            INNER JOIN roommembers 
            ON rooms.room_id = roommembers.room_id
            WHERE roommembers.member = ? AND rooms.room_id = ?`,
          [clientId, roomConnections.room, clientId, roomConnections.room]
        );

        if (!room[0].length) {
          return res.status(403).send({
            error: 'User is not a member of the room',
          });
        }

        const messages = await this.db.query(
          'SELECT * FROM messages WHERE room_id = ? ORDER BY date',
          [roomConnections.room]
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
      } catch (err) {
        next();
      }
    });

    this.app.post('/api/inviteToRoom', async (req, res, next) => {
      try {
        const clientId = req.session.user.user_id;
        const roomId = req.body.roomId;
        const invitedMembers = req.body.invitedMembers;
        // Check if the user is moderator of the room
        const results = await this.db.query(
          'SELECT * FROM rooms WHERE moderator = ? AND room_id = ?',
          [clientId, roomId]
        );

        if (!results[0]) {
          throw new NotAllowedException(
            'You are not a moderator of this room',
            404
          );
        }
        invitedMembers.forEach(async (user) => {
          let invitationId = uuid.v4();
          await this.db.query(
            'INSERT INTO roomInvitations (roomInvitations_id, room_id, invitationTo, accepted) VALUES (?, ?, ?,?)',
            [invitationId, roomId, user.id, false]
          );
          await this.sendInvitation(roomId, user.id, invitationId);
        });

        res.send({ message: 'Invitations sent successfully' });
      } catch (error) {
        next(error);
      }
    });

    this.app.post('/api/handleInvitation', async (req, res, next) => {
      try {
        const clientId = req.session.user.user_id;
        const { Accepted, invitationId } = req.body;

        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        if (!Accepted) {
          await this.db.query(
            'DELETE FROM roominvitations WHERE roomInvitations_id = ?',
            [invitationId]
          );
          return;
        }
        //get the room id from the invitation
        const [results] = await this.db.query(
          'SELECT room_id FROM roominvitations WHERE roomInvitations_id = ?',
          [invitationId]
        );
        const roomId = results[0].room_id;

        const roomMembersId = uuid.v4();

        //insert the user into the room
        await this.db.query(
          'INSERT INTO roomMembers (roomMembers_id,room_id, member,banned) VALUES (?,?,?,?)',
          [roomMembersId, roomId, clientId, false]
        );

        //delete the invitation
        await this.db.query(
          'DELETE FROM roominvitations WHERE roomInvitations_id = ?',
          [invitationId]
        );

        res.send({ message: 'Invitation accepted successfully' });
      } catch (err) {
        next();
      }
    });

    this.app.get('/api/invitations', async (req, res, next) => {
      try {
        const clientId = req.session.user?.user_id;

        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        // The user is connected to the room, so fetch the messages from the database
        const invitations = await this.db.query(
          `SELECT * FROM roominvitations WHERE invitationTo = ?`,
          [clientId]
        );

        const invitationsDTO = await Promise.all(
          invitations[0].map(async (x) => {
            const [room] = await this.getRoomById(x.room_id);
            return {
              roomName: room.roomName,
              roomId: x.room_id,
              invitationId: x.roomInvitations_id,
            };
          })
        );

        res.send(invitationsDTO);
      } catch {
        next();
      }
    });

    this.app.post('/api/banUser', async (req, res, next) => {
      try {
        const moderatorId = req.session.user.user_id;
        const roomId = req.body.roomId;
        const userId = req.body.userId;

        if (!moderatorId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        //Check if the user is a moderator
        const [moderator] = await this.db.query(
          `SELECT * FROM rooms
            WHERE room_id = ? AND moderator = ?`,
          [roomId, moderatorId]
        );

        if (!moderator) {
          throw new NotAllowedException('User is not a moderator', 403);
        }

        //Ban the user
        await this.db.query(
          `UPDATE roommembers SET banned = true 
    WHERE room_id = ? AND member = ? `,
          [roomId, userId]
        );

        //Send SSE message to the banned user
        const bannedUserConnection = this.connections.find(
          (c) => c.id === userId && c.room === roomId
        );

        if (bannedUserConnection) {
          bannedUserConnection.res.write(
            `event: ban\ndata: You have been banned from room ${roomId}\n\n`
          );
        }
        res.send({
          message: `User ${userId} has been banned from room ${roomId}`,
        });
      } catch (err) {
        next(err);
      }
    });

    this.app.get('/api/getRoomMembers/:roomId', async (req, res, next) => {
      try {
        const roomId = req.params.roomId;
        const [results] = await this.db.query(
          `SELECT * FROM rooms
          LEFT JOIN roommembers ON rooms.room_id = roommembers.room_id
          WHERE rooms.room_id = ?`,
          [roomId]
        );
        //if no members in the room, return nothing
        if (!results[0].member) {
          return;
        }

        const roomMembers = results.filter((x) => x.moderator !== x.member);
        const membersDTO = await Promise.all(
          roomMembers.map(async (member) => {
            const username = await this.getUsernameFromUserId(member.member);
            return {
              id: member.member,
              username,
              banned: member.banned,
            };
          })
        );

        const moderatorDTO = await this.getUsernameFromUserId(
          results[0].moderator
        );

        const roomMembersDTO = {
          moderator: moderatorDTO,
          members: membersDTO,
        };

        res.send(roomMembersDTO);
      } catch (err) {
        next(err);
      }
    });
  }

  broadcast(event, data) {
    for (let connection of this.connections) {
      connection.res.write(
        'event:' + event + '\ndata:' + JSON.stringify(data) + '\n\n'
      );
    }
  }

  async sendMessage(clientId, roomId, message) {
    // find the connections in the room
    const connectionsInRoom = this.connections.filter((c) => c.room === roomId);
    const time = new Date();
    for (let connection of connectionsInRoom) {
      console.log(connection);
      const sendMessage = {
        message: message,
        sender: await this.getUsernameFromUserId(clientId),
        date: await this.formatDate(time),
        sentByMe: connection.id === clientId,
      };

      connection.res.write(
        'event: new-message\ndata:' + JSON.stringify(sendMessage) + '\n\n'
      );
    }
  }

  async sendInvitation(roomId, invitedMembers, invitationId) {
    const connectionsOfInvitedMembers = this.connections.filter((c) =>
      invitedMembers.includes(c.id)
    );
    const room = await this.getRoomById(roomId);
    for (let connection of connectionsOfInvitedMembers) {
      const sendInvitation = {
        roomName: room[0].roomName,
        roomId: room[0].room_id,
        invitationId: invitationId,
      };
      connection.res.write(
        'event: new-invitation\ndata:' + JSON.stringify(sendInvitation) + '\n\n'
      );
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

  async getRoomById(roomId) {
    const room = await this.db.query('SELECT * FROM rooms WHERE room_id = ?', [
      roomId,
    ]);
    if (!room.length) {
      return null;
    }
    return room[0];
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
