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

        const pattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;

        if (!pattern.test(req.body.password)) {
          throw new InvalidInputException(
            'Password must be at least 8 characters, contain one capital letter, and one symbol',
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

        if (user[0].last_attempt) {
          const currentTime = new Date().getTime();
          const lastAttemptTime = new Date(user[0].last_attempt).getTime();
          const oneMinuteInMilliseconds = 60 * 1000;
          if (currentTime - lastAttemptTime > oneMinuteInMilliseconds) {
            user[0].login_attempts = 0;
            await this.db.query(
              `UPDATE users SET login_attempts = 0, last_attempt = null WHERE email = ?`,
              [normalizedEmail]
            );
          }
        }

        if (user[0].login_attempts >= 3) {
          await this.db.query(
            `UPDATE users SET last_attempt = ? WHERE email = ?`,
            [new Date(), normalizedEmail]
          );
          throw new InvalidInputException(
            'Too many login attempts, account locked for 1 minute',
            400
          );
        }

        const isMatch = bcrypt.compareSync(
          req.body.password + salt + pepper,
          user[0].password
        );

        if (!isMatch) {
          await this.db.query(
            `UPDATE users SET login_attempts = login_attempts + 1 WHERE email = ?`,
            [normalizedEmail]
          );
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
