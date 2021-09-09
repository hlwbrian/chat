const User = require('./../models/userModel');
const Chat = require('./../models/chatModel');
const Image = require('./../models/imageModel');
const path = require('path');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const nodemailer = require('nodemailer');

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

//Gen Reset token and send email
exports.createResetToken = catchAsync(async (req, res, next) => {  
    const user = await User.findOne({email: req.body.email});

    if(user){
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            secure: true,
            auth: {
                user: 'hlwbriantesting@gmail.com', //sender email address
                pass: 'ETHK#2525' //sender email password
            }
        });
      
        // send mail with defined transport object
        //let info = await transporter.sendMail({
        let info = await transporter.sendMail({
            from: 'hlwbriantesting@gmail.com', // sender address
            to: req.body.email, // list of receivers
            subject: "Testing reset token", // Subject line
            text: "Hello world?", // plain text body
            html: "<b>Hello world1241?</b>", // html body
        }, (error, info) => {
            if(error){
                console.log('something is wrong');
            }
        });
        
        res.status(201).json({
            message: 'Email sent'
        });
    }else{
        return next(
            new AppError('Email not found', 404)
        );
    }
});