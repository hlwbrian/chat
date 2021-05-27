const express = require('express');
const chatController = require('./../controllers/chatController');
const authController = require('./../controllers/authController.js');

const router = express.Router();

//Save message path, only called by server side
router
    .route('/save')
    .post(chatController.saveMessage);

//Protect all routes with authController.protect
router.use(authController.protect);

//Create chat room
router
    .route('/create')
    .post(chatController.createChat);

//Get the chatroom list with the lastest message
router
    .route('/getChatList')
    .get(chatController.getChatList);

//secureChat save current chat ID in req.currentChatID
router.use(authController.secureChat);

//Get conversation in chatroom and update read status
router
    .route('/initConversation')
    .post(chatController.initConversation);

//Add new member into the chatroom
router
    .route('/addMember')
    .post(chatController.addMember);

//Update chatroom name
router
    .route('/changeChatName')
    .patch(chatController.changeChatName);

//Update chatroom member list, remove target user
router
    .route('/leave')
    .patch(chatController.leaveChat);

//Update chatroom icon
 router
    .route('/changeIcon')
    .post(chatController.changeIcon);

module.exports = router;