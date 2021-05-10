const mongoose = require('mongoose');
const AppError = require('./../utils/appError');

const chatSchema = mongoose.Schema({
    chatID: {
        type: Number,
        unqiue: [true, 'A chatroom must have an unique ID'],
        default: 0
    },
    chatroomName: {
        type: String,
        required: [true, 'A chatroom must have a chatroom name'],
        maxlength: 32,
        minlength: 1
    },
    members: [String], //save User.userID
    conversations: [{
        sender: {
            type: String //User.userID
        },
        message: {
            type: String,
            minlength: 1,
            maxlength: 255
        },
        timestamp: {
            type: Date,
            default: Date.now()
        }
    }],
    chatCreate: {
        type: Date,
        default: Date.now()
    }
});

//Auto increment chat ID
chatSchema.pre('save', function(next){
    mongoose.models['Chat'].findOne({}, {}, { sort: { 'chatCreate' : -1 } }, function(err, data) {
        this.chatID = data.chatID + 1;
    });
   
    next();
});

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;