import * as userService from '../services/User.js';
import { InvalidInputException } from '../exceptions/InvalidInputException.js';
import { NotLoggedInException } from '../exceptions/NotLoggedInException.js';
import { NotAllowedException } from '../exceptions/NotAllowedException.js';
import acl from '../../acl.js';

export const registerUser = async (req, res, next) => {
  try {
    if (!acl('register', req)) {
      throw new NotAllowedException('You are not allowed!', 403);
    }

    // Validate the request body
    if (!req.body.email || !req.body.name || !req.body.password) {
      throw new InvalidInputException(
        'Please provide a email, name, and password',
        400
      );
    }
    const result = await userService.registerUser(req.body);
    return res.send(result);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    if (!acl('login', req)) {
      throw new NotAllowedException('You are not allowed!', 403);
    }

    // Validate the request body
    if (!req.body.email || !req.body.password) {
      throw new InvalidInputException(
        'Please provide a email, name, and password',
        400
      );
    }
    const result = await userService.loginUser(req.body, req.session);
    return res.send(result);
  } catch (error) {
    next(error);
  }
};

export const myProfile = async (req, res, next) => {
  try {
    if (!req.session.user) {
      throw new NotLoggedInException('User is not logged in', 401);
    }

    if (!acl('myProfile', req)) {
      throw new NotAllowedException('You are not allowed!', 403);
    }

    return res.send({ user: req.session.user });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    if (!req.session.user) {
      throw new NotLoggedInException('User is not logged in', 401);
    }

    if (!acl('logout', req)) {
      throw new NotAllowedException('You are not allowed!', 403);
    }

    await req.session.destroy();
    res.clearCookie('connect.sid');
    res.send({ message: 'Logged out!' });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    if (!req.session.user) {
      throw new NotLoggedInException('User is not logged in', 401);
    }

    if (!acl('getUsers', req)) {
      throw new NotAllowedException('You are not allowed!', 403);
    }

    const users = await userService.getUsers(req.session);

    res.send(users);
  } catch (error) {
    next(error);
  }
};
