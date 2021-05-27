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

router
    .route('/addImage')
    .post(imageController.addImage);

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