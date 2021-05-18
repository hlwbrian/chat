const express = require('express');
const userController = require('./../controllers/userController.js');
const authController = require('./../controllers/authController.js');

const router = express.Router();

router
    .route('/signup')
    .post(authController.signup);

router
    .route('/login')
    .post(authController.login);

router
    .route('/addImage')
    .post(userController.addImage);

//Protect all routes with authController.protec
router.use(authController.protect);

router
    .route('/update')
    .patch(userController.update);

 router
    .route('/changeIcon')
    .post(userController.changeIcon);

module.exports = router;