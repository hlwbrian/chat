const User = require('./../models/userModel');
const Chat = require('./../models/chatModel');
const Image = require('./../models/imageModel');
const path = require('path');
const catchAsync = require('./../utils/catchAsync');

exports.update = catchAsync(async (req, res, next) => {
    let username = req.body.username;
    let password = req.body.password;
    
    //find users
    const user = await User.findOne({userID : req.user.userID});

    if(!user || !(await user.correctPassword(password, user.password))){
        res.status(404).json({
            status: 'failed',
            message: 'Incorrect Username or Password'
        })
    }else{
        const updatedUser = await User.updateOne({userID: req.user.userID}, {username: username});
        const updateChatroom = await Chat.updateMany({members: req.user.username + '#' + req.user.userID}, 
                                                        {$set : { "members.$[element]" :  username + '#' + req.user.userID}},
                                                        {arrayFilters : [{ "element" : req.user.username + '#' + req.user.userID}]}
                                                    )
        if(updatedUser && updateChatroom){
            res.status(201).json({
                status: 'success',
                message: 'information updated'
            });
        }
    }
});

exports.changeIcon = catchAsync(async (req, res, next) => {
    //find users
    const updatedIcon = await User.updateOne({userID: req.user.userID}, {icon: req.body.icon});
    //Add image name into Image collection
    const addImage = await Image.create({name : req.body.icon});

    if(updatedIcon && addImage){
        res.status(201).json({
            status: 'success',
            message: 'Icon updated',
            img: req.body.icon
        });
    }else{
        res.status(404).json({
            status: 'failed',
            message: 'Update failed'
        });
    }
});

exports.addImage = catchAsync(async (req, res, next) => {
    let image, uploadPath;
    let appDir = path.dirname(require.main.filename);
    
    if(req.files.profileImage){
        image = req.files.profileImage;
        imageName = image.md5 + '.' + image.mimetype.split('/')[1];
        uploadPath = appDir + '/public/content/images/' + imageName;

        //upload function
        image.mv(uploadPath, err => {
            if(err){
                res.status(500).json({
                    msg: 'something wrong'
                });
            }else{
                res.redirect('/chatlist.html?uploadImg=' + imageName);
            }     
        });
    }else if(req.files.chatroomImage){
        image = req.files.chatroomImage;
        imageName = image.md5 + '.' + image.mimetype.split('/')[1];
        uploadPath = appDir + '/public/content/images/' + imageName;

        //upload function
        image.mv(uploadPath, err => {
            if(err){
                res.status(500).json({
                    msg: 'something wrong'
                });
            }else{
                backURL=req.header('Referer') || '/';
                res.redirect(backURL + '&uploadImg=' + imageName);
            }     
        });
    }else if(req.files.sendImage){
        image = req.files.sendImage;
        imageName = image.md5 + '.' + image.mimetype.split('/')[1];
        uploadPath = appDir + '/public/content/images/' + imageName;

        //upload function
        image.mv(uploadPath, err => {
            if(err){
                res.status(500).json({
                    msg: 'something wrong'
                });
            }else{
                backURL=req.header('Referer') || '/';
                res.redirect(backURL + '&sendImage=' + imageName);
            }     
        });
    }
});