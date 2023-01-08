const express = require('express');
const router = express.Router();
const userController = require('../controllers/User');

router.get('/hi', userController.SayHi);

module.exports = router;
