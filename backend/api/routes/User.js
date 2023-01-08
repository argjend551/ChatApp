import express from 'express';

const router = express.Router();

import {
  registerUser,
  loginUser,
  myProfile,
  logoutUser,
  getUsers,
} from '../controllers/User.js';

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/myProfile', myProfile);
router.post('/logout', logoutUser);
router.get('/users', getUsers);
router.get('/user');

export default router;
