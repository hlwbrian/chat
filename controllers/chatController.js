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