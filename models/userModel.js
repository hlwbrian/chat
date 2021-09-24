const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const userSchema = new mongoose.Schema({
    chatrooms: [Number], //save chatID
    username : {
        type: String,
        required : [true, 'A user must have a account name'],
        unique: true,
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
    resetToken: {
        type: String
    },
    tokenCreateTime: {
        type: Date
    },
    isLoggedIn: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now()
    },
    password: {
        type: String,
        required: [true, 'A user must have a user password']
    },
    icon : {
        type: String,
        default: 'default.png'
    },
    resetToken: String
});

userSchema.pre('save', async function(next) {
    this.username = this.username.toLowerCase();

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