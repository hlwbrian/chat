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
        newChat = await Chat.create({chatroomName : req.body.chatroom, members : [userData[1], req.user.userID]});
        //create two user's chatrooms
        updatedUsers = await User.updateMany({userID : {$in : [userData[1], req.user.userID]}}, {$push : {chatrooms : newChat.chatID}});
        
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

  const conversations = await Chat.find(data).select({"conversations" : 1, 'chatroomName' : 1});

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