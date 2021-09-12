const User = require('./../models/userModel');
const Chat = require('./../models/chatModel');
const Image = require('./../models/imageModel');
const path = require('path');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');

//Update personal information for user
exports.updateUserName = catchAsync(async (req, res, next) => {
    let username = req.body.username;

    //update the username in user collection
    const updatedUser = await User.updateOne({userID: req.user.userID}, {username: username});

    if(updatedUser){
        res.status(201).json({
            status: 'success',
            message: 'user information updated'
        });
    }else{
        return next(
            new AppError('Update failed', 404)
        );
    }
});

//Update user icon
exports.changeUserIcon = catchAsync(async (req, res, next) => {   
     
    //Add image name into Image collection
    const addImage = await Image.create({name : req.body.icon});

    //find users and update the icon name
    const updatedIcon = await User.updateOne({userID: req.user.userID}, {icon: req.body.icon});
    
    if(updatedIcon && addImage){
        res.status(201).json({
            status: 'success',
            message: 'Icon updated',
            img: req.body.icon
        });
    }else{
        return next(
            new AppError('Update failed', 401)
        );
    }
});

//Update user icon
exports.updateLogin = catchAsync(async (req, res, next) => {
    //find users and update the icon name
    if(req.body.serverSecret !== '5sa9gkj#7w') {
        return next(
            new AppError('Update failed', 401)
        );
    }

    const updateStatus = await User.updateOne({userID: req.body.userID}, {isLoggedIn: req.body.isLoggedIn});
    if(req.body.isLoggedIn === false){
        const updateLastSeenTime = await User.updateOne({userID: req.body.userID}, {lastSeen: new Date()});
    }

    if(updateStatus){
        res.status(201).json({
            status: 'success',
            message: 'Login status Updated',
            img: req.body.icon
        });
    }else{
        return next(
            new AppError('Update failed', 401)
        );
    }
});