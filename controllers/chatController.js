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
  const records = await Chat.find({ '_id': { $in: chatID } }).select({"details" : 0});

  res.status(200).json({
      msg: 'success',
      records
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