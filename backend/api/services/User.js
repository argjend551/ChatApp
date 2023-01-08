import { v4 } from 'uuid';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { InvalidInputException } from '../exceptions/InvalidInputException.js';
import * as userRepository from '../repository/User.js';

const saltRounds = 10;
const salt = process.env.SALT;
const pepper = process.env.PEPPER;

export const registerUser = async ({
  email,
  name,
  password,
  confirmPassword,
}) => {
  const normalizedEmail = validator.normalizeEmail(email);

  if (!validator.isEmail(normalizedEmail)) {
    throw new InvalidInputException(
      'Please provide a valid email address',
      400
    );
  }

  const existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new InvalidInputException(
      'A user with this email address already exists',
      400
    );
  }

  if (password !== confirmPassword) {
    throw new InvalidInputException('Passwords do not match', 400);
  }

  const id = v4();

  const encrypted = bcrypt.hashSync(password + salt + pepper, saltRounds);

  await createUser(id, normalizedEmail, encrypted, name, 'user');

  return { message: 'Registration successful' };
};

export const loginUser = async ({ email, password }, session) => {
  const normalizedEmail = validator.normalizeEmail(email);

  if (!validator.isEmail(normalizedEmail)) {
    throw new InvalidInputException(
      'Please provide a valid email address',
      400
    );
  }

  const user = await userRepository.getUserByEmail(normalizedEmail);

  if (!user) {
    throw new InvalidInputException('Invalid email or password', 400);
  }

  const isMatch = bcrypt.compareSync(password + salt + pepper, user.password);

  if (!isMatch) {
    throw new InvalidInputException('Invalid email or password', 400);
  }

  delete user.password;

  session.user = user;

  session.save();

  return { message: 'You have successfully logged in' };
};

export const getUsers = async (session) => {
  const users = await userRepository.getAllUsers(session.user.user_id);

  const usersDTO = users.map((user) => ({
    email: user.email,
    name: user.name,
  }));

  return usersDTO;
};
