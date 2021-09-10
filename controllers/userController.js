const User = require('./../models/userModel');
const Chat = require('./../models/chatModel');
const Image = require('./../models/imageModel');
const path = require('path');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const nodemailer = require('nodemailer');
const { profileEnd } = require('console');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

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
        //Token Create time
        let tokenTimestamp = new Date();
        let token = crypto.randomBytes(12).toString('hex');
        const updateTokenTime = await User.findOneAndUpdate({email: req.body.email}, {resetToken: token, tokenCreateTime : tokenTimestamp});

        if(updateTokenTime){
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                secure: true,
                auth: {
                    user: process.env.EMAIL_AC, //sender email address
                    pass: process.env.EMAIL_PWD //sender email password
                }
            });
               
            // send mail with defined transport object
            let info = await transporter.sendMail({
                from: process.env.EMAIL_AC, // sender address
                to: req.body.email, // list of receivers
                subject: "Reset Telechat Account Password", // Subject line
                text: "Reset the password within 15 mins", // plain text body
                html: "<h3>Reset Password</h3>" +
                      "<p>Click the link below to finish the reset process, remember to complete the whole procedure within 15 mins</p>" +
                      "<a href='" + process.env.DOMAIN + "content/reset_pwd.html?email="+ encodeURIComponent(req.body.email) +"&token=" + token + "'>Click here to continue</a>"
            }, (error) => {
                if(error){
                    return next(
                        new AppError('Send email failed', 500)
                    );
                }
            });
            
            res.status(201).json({
                message: 'Email sent'
            });
        }else{
            return next(
                new AppError('Gen reset token failed', 500)
            );
        }     
    }else{
        return next(
            new AppError('Email not found', 404)
        );
    }
});

//Reset user password
exports.resetPassword = catchAsync(async (req, res, next) => {  
    //return error if password not matched
    if(req.body.password !== req.body.passwordConfirm){
        return next(
            new AppError('Password not matched', 404)
        );
    }

    const user = await User.findOne({email: req.body.email});
    const tokenDB = user.resetToken;
    const tokenTimeDB = user.tokenCreateTime;
    const cureentTime = new Date();
    const tokenReq = req.body.token;
    let newPassword = await bcrypt.hash(req.body.password, 12);
    let timeDiff = (cureentTime - tokenTimeDB) / 1000 / 60; //in minutes

    //Handle token not equals
    if( tokenDB !== tokenReq && tokenDB !== ''){
        return next(
            new AppError('Wrong Token', 404)
        );
    }
    
    //Handle token expired
    if(timeDiff > parseInt(process.env.RESETTIMELIMIT) ){
        return next(
            new AppError('Token expired', 405)
        );
    }

    if(user){
        const updatePassword = await User.findOneAndUpdate({email: req.body.email}, {password: newPassword, resetToken: ''});

        if(updatePassword){
            res.status(201).json({
                message: 'Password Updated'
            });
        }else{
            return next(
                new AppError('Update failed', 500)
            );
        }    
    }else{
        return next(
            new AppError('Email not found', 404)
        );
    }
});