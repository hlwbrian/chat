const express = require('express');
const userController = require('./../controllers/userController.js');
const authController = require('./../controllers/authController.js');
const imageController = require('./../controllers/imageController.js');

const router = express.Router();

//sign up
router
    .route('/signup')
    .post(authController.signup);

//log in
router
    .route('/login')
    .post(authController.login);

//Create Reset password token
router
    .route('/createResetToken')
    .post(authController.createResetToken);

//Reset password
router
    .route('/resetPassword')
    .patch(authController.resetPassword);

router
    .route('/addImage')
    .post(imageController.addImage);

//update current login status
router
    .route('/updateLogin')
    .patch(userController.updateLogin);
    
//Other routes that below this will need logged-in user to access
router.use(authController.protect);

//update user personal information
router
    .route('/updateUserName')
    .patch(userController.updateUserName);

//update user icon 
 router
    .route('/changeUserIcon')
    .patch(userController.changeUserIcon);

module.exports = router;