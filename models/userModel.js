const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const userSchema = new mongoose.Schema({
    chatrooms: [String], //save chatID
    username : {
        type: String,
        required : [true, 'A user must have a account name'],
        maxlength: 32,
        minlength: 1
    },
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
    },
    password: {
        type: String,
        required: [true, 'A user must have a user password']
    },
    resetToken: String
});

userSchema.pre('save', async function(next) {
    //Encrypt the password before save
    this.password = await bcrypt.hash(this.password, 12);
    
    next();
});

//Add Schema methods
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.plugin(AutoIncrement, {inc_field: 'userID'});
const User = mongoose.model('User', userSchema);
module.exports = User;