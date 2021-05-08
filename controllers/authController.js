const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const path = require('path');
const url = require('url');
const catchAsync = require('./../utils/catchAsync.js');

//Sign token with user ID
const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SIGNATURE, {
        expiresIn: process.env.JWT_EXPIRE
    });
}

//Create a token and save in cookie(httpOnly)
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date (
            Date.now() + process.env.JWT_EXPIRE_COOKIE * 60 * 60 * 24 * 1000
        ),
        httpOnly: true
    }
    cookieOptions.secure = true;

    res.cookie('chatJWT', token, cookieOptions);

    //remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    const accountName = req.query.accountName;
    const password = req.query.password;
    const email = req.query.email;
    const phoneNo = req.query.phoneNo;
    console.log(req);
    const newUser = await User.create({accountName, password, email, phoneNo});
    createSendToken(newUser, 200, res);
});

exports.login = catchAsync( async (req, res, next) => {
    const username = req.query.username;
    const password = req.query.password;

    //Check if username & password are filled
    if(!username || !password){
    }

    //find users
    const user = await User.findOne({accountName : username});
    
    if(!user || !(await user.correctPassword(password, user.password))){
        console.log('Cannot find this user');
        res.sendFile('/Users/brianwong/Desktop/chat/content/login.html');
    }else{
        console.log('User fonund!!!!');
        createSendToken(user, 200, res);
    }

    //TODO update
    
    //res.sendFile('/Users/brianwong/Desktop/chat/content/login.html');
});
