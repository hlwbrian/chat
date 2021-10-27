const jwt = require('jsonwebtoken');
const jwt_decode = require('jwt-decode');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync.js');
const AppError = require('../utils/appError');
const nodemailer = require('nodemailer');
const { profileEnd } = require('console');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

/* testing
Sign token function
 expires in 60 days
*/
const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SIGNATURE, {
        expiresIn: process.env.JWT_EXPIRE
    });
}

/* Create token with signToken() and send back to client side */
const createSendToken = (user, statusCode, res) => {
    //use mongoDB default id from User collection as the token
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date (
            Date.now() + process.env.JWT_EXPIRE_COOKIE * 60 * 60 * 24 * 1000
        ),
        //TODO: httpOnly: true
    }
    //TODO: cookieOptions.secure = true;

    //set client browser cookie chatJWT=<token>
    res.cookie('chatJWT', token, cookieOptions);

    //remove password from output
    user.password = undefined;

    res.status(200).json({
        status: 'success',
        message: 'Login successful'
    });
}

/* Signup function  */
exports.signup = catchAsync(async (req, res, next) => {
    //destruct and get all the required data
    const {username, email, password, passwordConfirm} = req.body;

    const newUser = await User.create({username, email, password, passwordConfirm});

    //auto login after signup
    createSendToken(newUser, 200, res);
});

/* Login function */
exports.login = catchAsync( async (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    //find users
    const user = await User.findOne({username : username});

    //user.correctPassword is a model method, may refer to models/userModel
    if(!user || !(await user.correctPassword(password, user.password))){
        return next(
            new AppError(
              'Incorrect Username or Password',
              404
            )
        );
    }else{
        createSendToken(user, 200, res);
    }
});

/* 
Protect function: ensure some route/resource can only get by logged-in users
Express middleware include this function before include other function that required logged-in status
*/
exports.protect = catchAsync(async (req, res, next) => {
    //GET token and check if it exists
    let token;

    //Check request header for token
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }
    
    //If token is undefined then generate error message and status code
    if(!token || token === 'undefined'){
        return next(
            new AppError('You are not logged in! Please log in to get access.', 401)
        );
    }

    const decoded = jwt_decode(token);
    
    const currentUser = await User.findById(decoded.id);
    //If user is undefined then generate error message and status code
    if(!currentUser) {
        return next(
            new AppError(
              'The user does not exist',
              401
            )
        );
    }

    //Put found user info into req.user for later usage
    req.user = currentUser;
    next();
});

/*
Secure chat: get the current chat ID for later usage
*/
exports.secureChat = catchAsync(async (req, res, next) => {
    let data;
    if(!req.body.currentChatID){
        return next(
            new AppError(
              'Chatroom ID does not exist',
              401
            )
        );
    }

    data = {
        currentChatID : req.body.currentChatID
    }

    req.chat = data;
    next();
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

