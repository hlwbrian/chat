const express = require('express');
const chatController = require('./../controllers/chatController');
const authController = require('./../controllers/authController.js');

const router = express.Router();

//Save message path, only called by server side
router
    .route('/save')
    .post(chatController.saveMessage);

//Del message after timeout
router
    .route('/timeoutDel')
    .patch(chatController.timeoutDel);

//Protect all routes with authController.protect
router.use(authController.protect);

//Create chat room
router
    .route('/create')
    .post(chatController.createChat);

//Get the chatroom list with the lastest message
router
    .route('/init')
    .get(chatController.init);

//secureChat save current chat ID in req.currentChatID
router.use(authController.secureChat);

//Get the messages detailes of chatroom and update read status
router
    .route('/initChatroom')
    .post(chatController.initChatroom);

//Get next 15 history messages
router
    .route('/loadMessages')
    .post(chatController.loadMessages);

//update unread status to read
 router
    .route('/updateRead')
    .patch(chatController.updateUnread);
    
//Remove message
router
    .route('/removeMsg')
    .patch(chatController.removeMsg);

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
    .patch(chatController.changeIcon);

module.exports = router;