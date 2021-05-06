const express = require('express');
const chatController = require('./../controllers/chatController');

const router = express.Router();
router
    .route('/create')
    .post(chatController.createChat);

module.exports = router;