const Chat = require('./../models/chatModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');

/* Get chatlist */
exports.init = catchAsync(async (req, res, next) => {
  const chatID = req.user.chatrooms;
  const records = await Chat.find({ 'chatID': { $in: chatID } }, {'conversations' : {$slice: -1} });

  const userInfo = {
    username : req.user.username,
    email : req.user.email,
    phone : req.user.phoneNo,
    userID : req.user.userID,
    icon : req.user.icon
  }

  res.status(200).json({
      msg: 'success',
      records,
      user: userInfo
  });
});

/* Create new chat */
exports.createChat = catchAsync(async (req, res, next) => {
    //Target user's info, this data is not the info for the user who created the user
    const userData = req.body.username.split('#');
    
    //Target user is not the user who create the chatroom
    if(userData[1] != req.user.userID){
      const user = await User.find({username: userData[0], userID: userData[1]});
      let newChat;

      //if target user found
      if(user.length > 0){
        //create new chat
        newChat = await Chat.create({chatroomName : req.body.chatroom, members : [user[0].userID, req.user.userID]});
        //push chatroom number into user's chatroom list
        updatedUsers = await User.updateMany({userID : {$in : [user[0].userID, req.user.userID]}}, {$push : {chatrooms : newChat.chatID}});
        
        res.status(201).json({
          status: 'success',
          records: newChat
        }); 
      } else{
        return next(
          new AppError('Target not found', 404)
        );
      }
    }else{
      return next(
        new AppError('Cannot create a chatroom yourself', 401)
      );
    }    
});

/* Get conversation for specific chatroom and update read status */
exports.initChatroom = catchAsync(async (req, res, next) => {
  var data = {
    chatID: req.chat.currentChatID
  };
  let messages = {};

  //get conversation
  const newMsg = await Chat.aggregate([
    {$match: data},
    {$unwind: "$messages"},
    {$match: { 'messages.read': {$nin : [req.user.userID.toString()]} }}
  ]);
  
  //limit 7 history messages
  const oldMsg = await Chat.aggregate([
    {$match: data},
    {$unwind: "$messages"},
    {$match: { 'messages.read': {$in : [req.user.userID.toString()]} }},
    {$limit: 7}
  ]);
  
  if(newMsg.length > 0 || oldMsg.length > 0){
    //generate result object
    messages = {
      _id : (oldMsg.length > 0)? oldMsg[0]._id:newMsg[0]._id,
      members : (oldMsg.length > 0)? oldMsg[0].members:newMsg[0].members,
      chatCreate : (oldMsg.length > 0)? oldMsg[0].chatCreate:newMsg[0].chatCreate,
      icon : (oldMsg.length > 0)? oldMsg[0].icon:newMsg[0].icon,
      chatroomName : (oldMsg.length > 0)? oldMsg[0].chatroomName:newMsg[0].chatroomName,
      readMsg : [],
      unreadMsg : []
    }

    if(oldMsg.length > 0){
      for(let [, value] of oldMsg.entries()){
        messages.readMsg.push(value.messages);
      }
    }

    if(newMsg.length > 0){
      for(let [, value] of newMsg.entries()){
        messages.unreadMsg.push(value.messages);
      }
    }
  }else{
    //GET chatroom info
    const chat = await Chat.find(data);
    messages = {
      _id : chat[0]._id,
      members : chat[0].members,
      chatCreate : chat[0].chatCreate,
      icon : chat[0].icon,
      chatroomName : chat[0].chatroomName,
      readMsg : [],
      unreadMsg : []
    };
  }

  //Get members username
  const membersID = messages.members;
  const members = await User.find({userID : {$in : membersID }}).select({"username": 1, "userID": 1});

  //set all the conversation read
  //const updateRead = await Chat.updateMany({chatID: req.chat.currentChatID}, { $addToSet : {'messages.$[].read' : req.user.userID }});

  //Find all members login status
  /*let memberList = messages[0].members.map((curVal) => {
    return curVal.split('#')[1];
  });
  const loginStatus = await User.find({userID : {$in: memberList}}).select({"lastSeen": 1, "isLoggedIn" : 1});*/

  if(messages){
    res.status(200).json({
      msg: 'success',
      content: messages,
      members
    });
  }else{
    return next(
      new AppError('No chat history', 404)
    );
  }
});

/* Get histry messages */
exports.loadMessages = catchAsync(async (req, res, next) => {
  let page = req.body.page;
  let skip = page * 7;
  let limit = 7;
  
  //get conversation
  const messages = await Chat.aggregate([
    { $match: { chatID: req.chat.currentChatID }, },
    { $unwind : '$messages' },
    { $match: { 'messages.read': {$in : [req.user.userID.toString()]} }},
    { $skip : skip },
    { $limit : limit }   
  ]);
  
  if(messages){
    res.status(200).json({
      msg: 'success',
      content: messages
    });
  }else{
    return next(
      new AppError('No more history messages', 404)
    );
  }
});

/* update read status for user in chat */
exports.updateUnread = catchAsync(async (req, res, next) => {
    //set all the conversation read
    const updateRead = await Chat.updateMany({chatID: req.chat.currentChatID}, { $addToSet : {'messages.$[].read' : req.user.userID }});
  
    if(updateRead){
      res.status(201).json({
        status: 'success',
        message: 'read status updated'
      })
    }else{
      return next(
        new AppError('Failed to update read status', 404)
      );
    } 
});

/* Save message should only call by server */
exports.saveMessage = catchAsync(async (req, res, next) => {
  //if match hardcode secret
  if(req.body.serverSecret === '5sa9gkj#7w'){
    let timestamp = new Date();
    let dataObj = {
      sender: req.body.userID,
      content: req.body.msg,
      isImage: req.body.isImage,
      timestamp: timestamp,
      read: [req.body.userID]
    }

    if(req.body.isMessage) dataObj.isMessage = req.body.isMessage;
    
    const chatData = await Chat.findOneAndUpdate({chatID: req.body.chatID}, {$push : {messages : { $each: [dataObj], $position: 0}}});
    
    if(chatData){
        res.status(200).json({
          status: 'success',
          msg: 'added',
          timestamp: timestamp,
          content: chatData
        });
    }
  }else{
    return next(
      new AppError('Failed to save message', 404)
    );
  }
});

/* Add member function */
exports.addMember = catchAsync(async (req, res, next) => {
    const userData = req.body.username.split('#');

    if(userData[1] != req.user.userID){
      const user = await User.find({userID: userData[1]});
      
      if(user.length > 0){
        //find if user is already in chatroom
        targetChatroom = await Chat.findOne({chatID : req.chat.currentChatID});
        let isExist = targetChatroom.members.includes(userData[1]);

        if(!isExist){
          //push member id into chatroom array
          updatedUsers = await User.updateOne({userID : userData[1]}, {$addToSet : {chatrooms : req.chat.currentChatID}});
          //push chat id into chatroom array & set history messages 'read' for that user
          updatedChat = await Chat.updateOne({chatID : req.chat.currentChatID}, {$push : {members : user[0].userID}, $addToSet : {'messages.$[].read' :  user[0].userID }});

          res.status(201).json({
            status: 'success',
            message: 'Member added',
            member : userData.join('#'),
            chatroomInfo : targetChatroom
          });
        }else{
          return next(
            new AppError('User is already in the chatroom', 402)
          );
        }
      }else{
        return next(
          new AppError('User not found', 404)
        );
      }
    }else{
      return next(
        new AppError('Same user', 401)
      );
    }
});

/* Update chatroom name */
exports.changeChatName = catchAsync(async (req, res, next) => {
    const newName = req.body.chatroomName;
    const updateChat = await Chat.updateOne( {chatID: req.chat.currentChatID}, {$set : {chatroomName : newName}});

    if(updateChat){
      res.status(201).json({
        status: 'success',
        message: 'Name changed'
      });
    }else{
      return next(
        new AppError('Chatroom not found', 404)
      );
    } 
});

/* Update Chatroom member list, remove target user */
exports.leaveChat = catchAsync(async (req, res, next) => {
  const userData = req.user.userID;
  
  const chatRecord = await Chat.findOne({chatID: req.chat.currentChatID});
  if(chatRecord.members.length > 1){
    //remove users chatroom list
    const updateUser = await User.updateOne({userID: req.user.userID}, {$pull : {chatrooms : req.chat.currentChatID}});
    //remove chat members list element
    const updateChat = await Chat.updateOne({chatID: req.chat.currentChatID}, {$pull : {members : userData}});

    if(updateUser && updateChat){
      res.status(201).json({
        status: 'success'
      });
    }else{
      return next(
        new AppError('Failed to leave group', 404)
      );
    }
  }else{
    const delChat = await Chat.deleteOne({chatID: req.chat.currentChatID});

    res.status(201).json({
      status: 'success',
      msg: 'chat deleted'
    });
  }
});

exports.changeIcon = catchAsync(async (req, res, next) => {
  const updateChatIcon = await Chat.findOneAndUpdate({chatID : req.chat.currentChatID}, {icon: req.body.imageName});

  if(updateChatIcon){
    res.status(200).json({
      msg: 'success'
    });
  }else{
    return next(
      new AppError('Failed to change icon', 401)
    );
  }
});