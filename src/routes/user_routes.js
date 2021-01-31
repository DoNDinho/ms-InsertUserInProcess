'use strict';
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');

// Metodo para insertar usuario en proceso de registro
router.post('/user/in-process', userController.user);

module.exports = router;
