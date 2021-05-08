const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    accountName : {
        type: String,
        required : [true, 'A user must have a account name']
    },
    password: {
        type: String,
        required: [true, 'A user must have a user password']
    },
    chatrooms: [String],
    email: {
        type: String,
        required: [true, 'A user must have an email address'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    phoneNo: {
        type: String,
        required: [true, 'A user must have a phone number'],
        unique: true,
    }
    //icon
});

//Encrypt Password before save the data in the db
userSchema.pre('save', async function(next) {
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

//Add Schema methods
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

const User = mongoose.model('User', userSchema);
module.exports = User;

/*
//Users Data Structure
{
	data: {
		members: [
			{
				memberID: String,
				accountName: String,
				password: String,
				conversations: [Chatid],
				phoneNo : Number,
				email : String,
				icon : String
			}
		]
	}
}
*/