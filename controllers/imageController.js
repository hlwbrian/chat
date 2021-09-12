const path = require('path');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');

//Add image into MongoDB
exports.addImage = catchAsync(async (req, res, next) => {
    let image, uploadPath;
    let appDir = path.dirname(require.main.filename);
    
    image = req.files.profileImage || req.files.chatroomImage || req.files.sendImage;
    if(!image){
        return next(
            new AppError('Add image failed', 404)
        );
    }
    
    imageName = image.md5 + '.' + image.mimetype.split('/')[1];
    uploadPath = appDir + '/public/images/' + imageName;

    //upload function
    image.mv(uploadPath, err => {
         if(err){
            return next(
                new AppError('Add image failed', 404)
            );
        }else{
            if(req.files.profileImage){
                res.redirect('/content/chat.html?uploadImg=' + imageName);
            }else if(req.files.chatroomImage){
                backURL=req.header('Referer') || '/';
                res.redirect(backURL + '&uploadImg=' + imageName);
            }else if(req.files.sendImage){
                backURL=req.header('Referer') || '/';
                res.redirect(backURL + '&sendImage=' + imageName);
            }
        }     
    });
});