const express = require('express');
const userController = require('./../controllers/userController.js');
const authController = require('./../controllers/authController.js');

const router = express.Router();
router
    .route('/signup')
    .get(authController.signup);

router
    .route('/login')
    .get(authController.login);

module.exports = router;