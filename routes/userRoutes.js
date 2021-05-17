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

//Protect all routes with authController.protec
router.use(authController.protect);

router
    .route('/update')
    .patch(userController.update);

module.exports = router;