const User = require('./../models/userModel');
const Chat = require('./../models/chatModel');
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

//TODO remove
exports.utest = (req, res, next) => {
    res.status(200).json({
        msg: 'utest good'
    });
};