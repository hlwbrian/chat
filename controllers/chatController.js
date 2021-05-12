const Chat = require('./../models/chatModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

exports.createChat = catchAsync(async (req, res, next) => {
    const userData = req.body.username.split('#');
    
    if(userData[1] != req.user.userID){
      const user = await User.find({username: userData[0], userID: userData[1]});
      let newChat;

      if(user.length > 0){
        //create new chat
        newChat = await Chat.create({chatroomName : req.body.chatroom, members : [user[0].username + '#' + user[0].userID, req.user.username + '#' + req.user.userID]});
        //create two user's chatrooms
        updatedUsers = await User.updateMany({userID : {$in : [user[0].userID, req.user.userID]}}, {$push : {chatrooms : newChat.chatID}});
        
        res.status(201).json({
          status: 'success',
          records: newChat
        }); 
      } else{
        res.status(404).json({
          status: 'failed',
          message: 'User not found'
        });
      }
    }else{
      res.status(401).json({
        status: 'failed',
        message: 'Cannot create a chatroom yourself'
      });
    }    
});

exports.getChat = catchAsync(async (req, res, next) => {
  const chatID = req.user.chatrooms;
  const records = await Chat.find({ 'chatID': { $in: chatID } }, {'conversations' : {$slice: 1} });
  const userInfo = {
    username : req.user.username,
    email : req.user.email,
    phone : req.user.phoneNo,
    userID : req.user.userID
  }

  res.status(200).json({
      msg: 'success',
      records,
      request: userInfo
  });
});

exports.getConversation = catchAsync(async (req, res, next) => {
  var data = {
    chatID: req.chat.currentChatID
  };

  const conversations = await Chat.find(data).select({"conversations" : 1, 'chatroomName' : 1, 'members': 1});

  if(conversations){
    res.status(200).json({
      msg: 'success',
      content: conversations
    });
  }else{
    res.status(404).json({
      msg: 'failed'
    });
  }

});

exports.addMember = catchAsync(async (req, res, next) => {
    const userData = req.body.username.split('#');

    if(userData[1] != req.user.userID){
      const user = await User.find({username: userData[0], userID: userData[1]});
      
      if(user.length > 0){
        //find if user is already in chatroom
        targetChatroom = await Chat.findOne({chatID : req.chat.currentChatID});
        let isExist = targetChatroom.members.includes(userData[0] + '#' + userData[1]);

        if(!isExist){
          //push member id into chatroom array
          updatedUsers = await User.updateOne({userID : userData[1]}, {$push : {chatrooms : req.chat.currentChatID}});
          //push chat id into chatroom array
          updatedChat = await Chat.updateOne({chatID : req.chat.currentChatID}, {$push : {members : user[0].username + '#' + user[0].userID}});

          res.status(201).json({
            status: 'success',
            message: 'Member added',
            member : userData.join('#')
          });
        }else{
          res.status(404).json({
            status: 'failed',
            message: 'user is already in the chatroom'
          });
        }
      }else{
        res.status(404).json({
          status: 'failed',
          message: 'user not found'
        });
      }
    }else{
      res.status(401).json({
        status: 'failed',
        message: 'cannot add yourself to the group'
      });
    }
});

exports.changeChatName = catchAsync(async (req, res, next) => {
    const newName = req.body.chatroomName;
    const updateChat = await Chat.updateOne( {chatID: req.chat.currentChatID}, {$set : {chatroomName : newName}});
    
    if(updateChat){
      res.status(201).json({
        status: 'success',
        message: 'Name changed'
      });
    }else{
      res.status(404).json({
        status: 'failed',
        message: 'Chatroom not found'
      });
    } 
});