const Chat = require('./../models/chatModel');
const catchAsync = require('./../utils/catchAsync');

exports.createChat = catchAsync(async (req, res, next) => {
    const newChat = await Chat.create(req.body);
  
    res.status(201).json({
      status: 'success',
      data: {
        chat: newChat
      }
    });
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
  const chatID = req.query;
  const record = await Chat.find(chatID).select({"details" : 1});

  res.status(200).json({
      msg: 'success',
      record
  });
});