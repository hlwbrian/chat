const mongoose = require('mongoose');

const chatSchema = mongoose.Schema({
    isGroup: {
        type: Boolean,
        required: [true, 'Is group indicator must be provided']
    },
    chatroomName: {
        type: String,
        required: [true, 'A chatroom must have a chatroom name']
    },
    members: [String],
    details: [{
        sender: {
            type: String
        },
        content: {
            type: String
        },
        timestamp: {
            type: Date,
            default: Date.now()
        }
    }]
});

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;

/**
//Conversation Data Structure
{
	data: {
		chatroomNo : Number,
		conversations : [
			{
				chatid : String,
				isGroup : Boolean,
				members: [memberID],
				details : [
					{
						sender : memberID
						content : String,
						timestamp : Datetime
					}
				]
			}
		]
	}
}

 */