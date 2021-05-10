const mongoose = require('mongoose');

const chatSchema = mongoose.Schema({
    chatID: {
        type: Number,
        required: [true, 'A chatroom must have an ID'],
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

const Chat = mongoose.model('Chat', chatSchema);

//Auto increment chat ID
chatSchema.pre('save', function(next){
    let latestRecord = Chat.find().sort({chatCreate : -1});

    if(latestRecord)
        this.chatID = latestRecord.chatID + 1;

    next();
});

module.exports = Chat;