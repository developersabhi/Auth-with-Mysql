const { check }= require('express-validator')

exports.signUpValidation = [
    check('name', 'Name is require').not().isEmpty(),
    check('email', 'Please enter a valid mail').isEmail().normalizeEmail({ gmail_remove_dots: true}),
    check('password', 'Password is require').isLength({ min:6 }),
    check('image').custom((value, { req }) => {
        if(req.file.mimetype == 'image/jpeg' || req.file.mimetype == 'image/png'){
            return true;
        }else{
            return false;
        }
    }).withMessage('Please Upload an Image type PNG, JPG')
]

exports.loginValidation =[
    check('email', 'Please enter a valid mail').isEmail().normalizeEmail({ gmail_remove_dots:true}),
    check('password','Password is required').isLength({min:6})
]