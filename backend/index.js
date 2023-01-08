import express from 'express';
import http from 'http';
import session from 'express-session';
import MySQLStore from 'express-mysql-session';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import errorHandler from './api/middlewares/GlobalException.js';
import userRoutes from './api/routes/User.js';

const app = express();

app.use('/api', userRoutes);

const options = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'citaku1',
  database: 'nodejs-users',
  checkExpirationInterval: 900000, // check for expired sessions every 15 minutes
  expiration: parseInt(process.env.MAX_AGE), // expires in 30 min
};

dotenv.config({
  path: 'backend/secrets/secrets.env',
  encoding: 'utf8',
});

const sessionStore = new MySQLStore(options);

// the client dont need to authenticatate in 1 hour
// the session stored in database will automatically
// start new session every 30 min

app.use(
  session({
    secret: process.env.SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
      path: '/',
      secure: 'auto',
      maxAge: 3600000, // expiress in 1 hour
    },
  })
);

app.use(
  cors({
    origin: 'http://127.0.0.1:3000',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

app.use(errorHandler);
