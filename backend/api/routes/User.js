import express from 'express';

const router = express.Router();

//import { SayHi } from '../controllers/User.js';

router.get('/register');
router.get('/login');
router.get('/myProfile');
router.get('/logout');
router.get('/users');
router.get('/user');

export default router;
