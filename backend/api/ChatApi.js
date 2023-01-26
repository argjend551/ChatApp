const uuid = require('uuid');
const acl = require('../acl');
const checkBadWords = require('../badWords');
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
        const clientId = req.session.user.user_id;
        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        if (!acl('sse', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }

        this.connections = this.connections.filter(
          (c) => c.id !== req.session.user.user_id
        );

        res.set({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });

        this.connections.push({
          id: req.session.user.user_id,
          res: res,
        });

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
        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        if (!acl('enterRoom', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }
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
        if (result.length > 0 || acl('enterRoomAdmin', req)) {
          const moderator = result.find((x) => x.moderator === clientId);
          const member = result.find((x) => x.member === clientId);

          if (!moderator && member) {
            if (member.banned) {
              throw new NotAllowedException(
                'User is banned from this room',
                403
              );
            }
          }
          const existingConnection = this.connections.find(
            (c) => c.id === clientId
          );

          if (existingConnection) {
            existingConnection.room = roomId;
            res.send({ moderator: !!moderator || acl('enterRoomAdmin', req) });
          } else {
            this.connections.push({
              id: clientId,
              res: res,
              room: roomId,
            });
            res.send({ moderator: !!moderator || acl('enterRoomAdmin', req) });
          }
        } else {
          throw new NotAllowedException(
            'User is not a member of the room',
            405
          );
        }
      } catch (err) {
        next(err);
      }
    });

    this.app.get('/api/rooms', async (req, res, next) => {
      try {
        const clientId = req.session.user.user_id;

        if (!acl('rooms', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }

        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        let rooms;

        if (!acl('getAllRoomsAdmin', req)) {
          rooms = await this.db.query(
            `SELECT * FROM rooms WHERE moderator = ?
            UNION
            SELECT rooms.* FROM rooms, roommembers WHERE rooms.room_id = roommembers.room_id AND roommembers.member = ?
            ORDER BY roomName
        `,
            [clientId, clientId]
          );
        } else if (acl('getAllRoomsAdmin', req)) {
          rooms = await this.db.query(`SELECT * FROM rooms ORDER BY roomName`);
        }

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

        if (!acl('createRoom', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }

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

        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        if (!acl('sendMessage', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }
        const roomId = req.body.roomId;
        let message = checkBadWords(req.body.message);

        const results = await this.db.query(
          `SELECT * FROM rooms
          LEFT JOIN roommembers ON rooms.room_id = roommembers.room_id
          WHERE (moderator = ? OR roommembers.member = ?) AND rooms.room_id = ?`,
          [clientId, clientId, roomId]
        );
        if (!results[0].length && !acl('sendMessageAdmin', req)) {
          throw new NotAllowedException(
            'User is not a member of the room',
            403
          );
        }

        const checkBan = results[0].find((x) => x.member === clientId);

        if (checkBan && checkBan.banned) {
          throw new NotAllowedException('User is banned from this room', 403);
        }

        const messageId = uuid.v4();

        this.sendMessage(
          messageId,
          clientId,
          roomId,
          message,
          acl('sendMessageAdmin', req)
        );

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

        if (!acl('getAllMessages', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }

        const roomConnections = this.connections.find(
          (connection) => connection.id === clientId
        );

        if (!roomConnections) {
          return;
        }

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

        if (!room[0].length && !acl('getAllMessagesAdmin', req)) {
          throw new NotAllowedException(
            'User is not a member of the room',
            403
          );
        }

        const messages = await this.db.query(
          'SELECT * FROM messages WHERE room_id = ? ORDER BY date',
          [roomConnections.room]
        );

        const messageDTO = await Promise.all(
          messages[0].map(async (message) => {
            const user = await this.getUserFromUserId(message.sender);
            const date = await this.formatDate(message.date);
            return {
              id: message.message_id,
              message: message.message,
              sender: user.name,
              date: date,
              sentByMe: message.sender === clientId,
              admin: user.role == 'admin',
              deleted_by_admin: message.deleted_by_admin,
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
        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        if (!acl('inviteToRoom', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }

        const roomId = req.body.roomId;
        const invitedMembers = req.body.invitedMembers;
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

    this.app.delete('/api/deleteMessage', async (req, res, next) => {
      try {
        const clientId = req.session.user.user_id;
        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }
        if (!acl('deleteMessage', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }
        const { messageId, roomId } = req.body;
        await this.db.query(
          'UPDATE messages SET message = "This message was deleted by an admin", deleted_by_admin = true WHERE message_id = ?',
          [messageId]
        );

        this.connections.forEach((connection) => {
          if (connection.room === roomId) {
            connection.res.write(
              `event: delete-message\ndata:${messageId}\n\n`
            );
          }
        });
        res.send({
          message: `Message ${messageId} has been removed from room ${roomId}`,
        });
      } catch (error) {
        next(error);
      }
    });

    this.app.post('/api/handleInvitation', async (req, res, next) => {
      try {
        const clientId = req.session.user.user_id;
        const clientName = req.session.user.name;
        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        if (!acl('handleInvitation', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }
        const { Accepted, invitationId } = req.body;

        if (!Accepted) {
          await this.db.query(
            'DELETE FROM roominvitations WHERE roomInvitations_id = ?',
            [invitationId]
          );
          return;
        }
        const [results] = await this.db.query(
          'SELECT room_id FROM roominvitations WHERE roomInvitations_id = ?',
          [invitationId]
        );
        const roomId = results[0].room_id;

        const roomMembersId = uuid.v4();

        await this.db.query(
          'INSERT INTO roomMembers (roomMembers_id,room_id, member,banned) VALUES (?,?,?,?)',
          [roomMembersId, roomId, clientId, false]
        );

        await this.db.query(
          'DELETE FROM roominvitations WHERE roomInvitations_id = ?',
          [invitationId]
        );

        const user = {
          id: clientId,
          username: clientName,
          banned: false,
        };

        this.connections.forEach((connection) => {
          if (connection.room === roomId) {
            connection.res.write(
              `event: join-room\ndata:${JSON.stringify(user)}\n\n`
            );
          }
        });
        res.send({ message: 'Invitation accepted successfully' });
      } catch (err) {
        next();
      }
    });

    this.app.get('/api/invitations', async (req, res, next) => {
      try {
        const clientId = req.session.user.user_id;
        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        if (!acl('invitations', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }

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

        if (!acl('banUser', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }

        const [moderator] = await this.db.query(
          `SELECT * FROM rooms
            WHERE room_id = ? AND moderator = ?`,
          [roomId, moderatorId]
        );

        if (!moderator) {
          throw new NotAllowedException('User is not a moderator', 403);
        }

        await this.db.query(
          `UPDATE roommembers SET banned = true 
    WHERE room_id = ? AND member = ? `,
          [roomId, userId]
        );

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
        const clientId = req.session.user.user_id;
        if (!clientId) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        if (!acl('getRoomMembers', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }

        const roomId = req.params.roomId;

        const [results] = await this.db.query(
          `SELECT * FROM rooms
          LEFT JOIN roommembers ON rooms.room_id = roommembers.room_id
          WHERE rooms.room_id = ?`,
          [roomId]
        );

        const moderatorDTO = await this.getUserFromUserId(results[0].moderator);
        if (!results[0].member) {
          return res.send({ moderator: moderatorDTO.name });
        }
        const roomMembers = results.filter((x) => x.moderator !== x.member);

        const membersDTO = await Promise.all(
          roomMembers.map(async (member) => {
            const user = await this.getUserFromUserId(member.member);
            return {
              id: member.member,
              username: user.name,
              banned: member.banned,
              admin: user.role === 'admin',
            };
          })
        );

        const roomMembersDTO = {
          moderator: moderatorDTO.name,
          members: membersDTO,
        };

        res.send(roomMembersDTO);
      } catch (err) {
        next(err);
      }
    });
  }

  async sendMessage(messageId, clientId, roomId, message, admin) {
    const connectionsInRoom = this.connections.filter((c) => c.room === roomId);
    const time = new Date();
    for (let connection of connectionsInRoom) {
      const user = await this.getUserFromUserId(clientId);
      const sendMessage = {
        id: messageId,
        message: message,
        sender: user.name,
        date: await this.formatDate(time),
        sentByMe: connection.id === clientId,
        admin: admin,
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

  async getUserFromUserId(userId) {
    const [results] = await this.db.query(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );
    if (!results.length) {
      return null;
    }
    return results[0];
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
