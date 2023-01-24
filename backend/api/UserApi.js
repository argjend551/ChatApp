const uuid = require('uuid');
const acl = require('../acl');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const validator = require('validator');
const InvalidInputException = require('../api/exceptions/InvalidInputException');
const NotLoggedInException = require('../api/exceptions/NotLoggedInException');
const NotAllowedException = require('../api/exceptions/NotAllowedException');

module.exports = class UserApi {
  db = mysql.createPool(require('../secrets/dbCredentials.json'));
  constructor(expressapp) {
    this.app = expressapp;
    this.start();
  }
  start() {
    const saltRounds = parseInt(process.env.SALT_ROUNDS);
    const salt = process.env.SALT;
    const pepper = process.env.PEPPER;

    this.app.post('/api/register', async (req, res, next) => {
      try {
        console.log(req.session.user);
        if (!acl('register', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }
        if (
          !req.body.email ||
          typeof req.body.email !== 'string' ||
          !req.body.name ||
          typeof req.body.name !== 'string' ||
          !req.body.password ||
          typeof req.body.password !== 'string' ||
          !req.body.confirmPassword ||
          typeof req.body.confirmPassword !== 'string'
        ) {
          throw new InvalidInputException(
            'Please provide a username, name, and password',
            400
          );
        }

        const normalizedEmail = validator.normalizeEmail(req.body.email);

        if (!validator.isEmail(normalizedEmail)) {
          throw new InvalidInputException(
            'Please provide a valid email address',
            400
          );
        }

        const existingUser = await this.db.query(
          `SELECT * FROM users WHERE email = ?`,
          [normalizedEmail]
        );

        if (existingUser[0].length) {
          throw new InvalidInputException(
            'A user with this email address already exists',
            400
          );
        }

        if (req.body.password !== req.body.confirmPassword) {
          throw new InvalidInputException('Passwords does not match', 400);
        }

        const id = uuid.v4();

        const encrypted = bcrypt.hashSync(
          req.body.password + salt + pepper,
          saltRounds
        );

        await this.db.query(
          `INSERT INTO users (user_id, email, password, name,role) VALUES (?, ?, ?, ?,?)`,
          [id, normalizedEmail, encrypted, req.body.name, 'user']
        );

        return res.send({ message: 'Registration successful' });
      } catch (error) {
        next(error);
      }
    });

    this.app.post('/api/login', async (req, res, next) => {
      try {
        if (!acl('login', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }

        if (!req.body.email || !req.body.password) {
          throw new InvalidInputException(
            'Please provide a username and password',
            400
          );
        }
        const normalizedEmail = validator.normalizeEmail(req.body.email);

        const [user] = await this.db.query(
          `SELECT * FROM users WHERE email = ?`,
          [normalizedEmail]
        );

        if (!user.length) {
          throw new InvalidInputException('Invalid username or password', 400);
        }

        const isMatch = bcrypt.compareSync(
          req.body.password + salt + pepper,
          user[0].password
        );

        if (!isMatch) {
          throw new InvalidInputException('Invalid username or password', 400);
        }

        delete user[0].password;

        req.session.user = user[0];

        req.session.save();

        return res.send({ loggedIn: true, user: req.session.user });
      } catch (error) {
        next(error);
      }
    });

    this.app.get('/api/myProfile', async (req, res, next) => {
      try {
        if (!acl('myProfile', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }
        if (!req.session.user) {
          throw new NotLoggedInException('User is not logged in', 401);
        }
        return res.send({ loggedIn: true, user: req.session.user });
      } catch (error) {
        next(error);
      }
    });

    this.app.post('/api/logout', async (req, res, next) => {
      try {
        if (!acl('logout', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }
        if (!req.session.user) {
          throw new NotLoggedInException('User is not logged in', 401);
        }
        await req.session.destroy();
        res.clearCookie('connect.sid');
        res.send({ message: 'Logged out!' });
      } catch (error) {
        next(error);
      }
    });

    this.app.get('/api/users', async (req, res, next) => {
      try {
        if (!req.session.user) {
          throw new NotLoggedInException('User is not logged in', 401);
        }

        if (!acl('getUsers', req)) {
          throw new NotAllowedException('Not allowed!', 403);
        }

        const currentUser = req.session.user.user_id;
        const users = await this.db.query(
          `SELECT * FROM users WHERE user_id != ? ORDER BY name`,
          [currentUser]
        );
        const usersDTO = users[0].map((user) => ({
          id: user.user_id,
          email: user.email,
          name: user.name,
        }));
        res.json(usersDTO);
      } catch (error) {
        next(error);
      }
    });
  }
};
