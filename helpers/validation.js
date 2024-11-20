const { check }= require('express-validator')

exports.signUpValidation = [
    check('name', 'Name is require').not().isEmpty(),
    check('email', 'Please enter a valid mail').isEmail().normalizeEmail({ gmail_remove_dots: true}),
    check('password', 'Password is require').isLength({ min:6 })
]