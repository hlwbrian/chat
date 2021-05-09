const express = require('express');
const chatController = require('./../controllers/chatController');
const authController = require('./../controllers/authController.js');

const router = express.Router();

//Protect all routes with authController.protec
router.use(authController.protect);

router
    .route('/create')
    .post(chatController.createChat);

router
    .route('/getChat')
    .get(chatController.getChat);

router
    .route('/getConversation')
    .get(chatController.getConversation);


module.exports = router;