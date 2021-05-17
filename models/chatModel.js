const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const chatSchema = mongoose.Schema({
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
        read: [String], //User.userID
        timestamp: {
            type: Date,
            required: [true, 'A message must has a timestamp']           
        }
    }],
    chatCreate: {
        type: Date,
        default: Date.now()
    }
});

chatSchema.plugin(AutoIncrement, {inc_field: 'chatID'});
const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;