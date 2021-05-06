const express = require('express');
const userController = require('./../controllers/userController.js');

const router = express.Router();
router
    .route('/create')
    .post(userController.addUser);

module.exports = router;