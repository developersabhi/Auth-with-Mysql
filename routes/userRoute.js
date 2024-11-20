const express = require('express');
const router = express.Router();
const { signUpValidation } = require('../helpers/validation')

const userController = require('../controllers/userController')

router.post('/register', signUpValidation,userController.register)

module.exports = router;