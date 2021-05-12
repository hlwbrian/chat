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

//secureChat save current chat ID in req.currentChatID
router.use(authController.secureChat);
router
    .route('/getConversation')
    .post(chatController.getConversation);

router
    .route('/addMember')
    .post(chatController.addMember);

router
    .route('/changeChatName')
    .patch(chatController.changeChatName);

router
    .route('/leave')
    .patch(chatController.leaveChat);

module.exports = router;