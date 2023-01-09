import express from 'express';

const router = express.Router();

import { joinRoom } from '../controllers/Chat.js';

router.get('/sse/:roomId', joinRoom);

export default router;
