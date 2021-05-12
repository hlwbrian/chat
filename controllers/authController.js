const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const jwt_decode = require('jwt-decode');
const User = require('./../models/userModel');
const Chat = require('./../models/chatModel');
const path = require('path');
const url = require('url');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('../utils/appError');

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
        //TODO: httpOnly: true
    }
    //cookieOptions.secure = true;

    res.cookie('chatJWT', token, cookieOptions);

    //remove password from output
    user.password = undefined;

    res.status(200).json({
        status: 'success',
        message: 'Logged-in, welcome back'
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    const {username, password, passwordConfirm, email, phoneNo} = req.body;

    const newUser = await User.create({username, password, passwordConfirm, email, phoneNo});
    createSendToken(newUser, 200, res);
});

exports.login = catchAsync( async (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    //find users
    const user = await User.findOne({username : username});
    
    if(!user || !(await user.correctPassword(password, user.password))){
        res.status(404).json({
            status: 'failed',
            message: 'Incorrect Username or Password'
        })
    }else{
        createSendToken(user, 200, res);
    }
});

exports.protect = catchAsync(async (req, res, next) => {
    //GET token and check if it exists
    let token;
    
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }

    if(!token){
        res.send(400);
    }

    const decoded = jwt_decode(token);
    
    const currentUser = await User.findById(decoded.id);
    if(!currentUser) {
        next();
    }

    req.user = currentUser;
    next();
});

exports.secureChat = catchAsync(async (req, res, next) => {
    let data = {
        currentChatID : req.body.currentChatID
    }
    req.chat = data;
    next();
});

