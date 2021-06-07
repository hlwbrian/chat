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

    //update all the related chat to show new username
    const updateChatroom = await Chat.updateMany({members: req.user.username + '#' + req.user.userID}, 
                                                        {$set : { "members.$[element]" :  username + '#' + req.user.userID}},
                                                        {arrayFilters : [{ "element" : req.user.username + '#' + req.user.userID}]}
                                                    );
    if(updatedUser && updateChatroom){
        res.status(201).json({
            status: 'success',
            message: 'user information updated'
        });
    }else{
        return next(
            new AppError('Update failed', 401)
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