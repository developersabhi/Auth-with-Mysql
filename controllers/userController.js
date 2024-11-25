const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs');

const db = require('../config/dbConnection');

const randomstring = require('randomstring');
const sendMail  = require('../helpers/sendMail')

const jwt = require("jsonwebtoken");

const { JWT_SECRET } = process.env;

const register = (req, res) => {
    const errors = validationResult(req);
    console.log("register controller")

    if(!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    db.query(
        `SELECT * FROM users WHERE LOWER(email)= LOWER(${db.escape(
            req.body.email
        )});`,
        (err, result) => {
            if(result && result.length) {
                return res.status(409).send({
                    msg: 'This user is already is use!'
                });
            }
            else {
                bcrypt.hash(req.body.password, 10, (err, hash)=>{
                    if(err) {
                        return res.status(400).send({
                            msg: err.message // Take password in String
                        })
                    }else{
                        db.query(
                            `INSERT INTO users (name, email, password, image) VALUES ('${req.body.name}', ${db.escape(req.body.email)},${db.escape(hash)}, 'images/${req.file.filename}');`,
                            (err, result) => {
                                if(err) {
                                    return res.status(400).send({
                                        msg: err
                                    });
                                }

                                let mailSubject ='Mail Verification';
                                const randomToken = randomstring.generate();
                                let contant = '<p> Hi '+req.body.name+ ', \ Please <a href="http://localhost:3000/mail-verification?token='+randomToken+'" >verify</a>Your Mail';
                                sendMail(req.body.email,mailSubject, contant)

                                db.query(`UPDATE users set token=? where email =?`,[randomToken,req.body.email], function(error, result){
                                    if(error){
                                        return res.status(400).send({
                                            msg: error.message
                                        })
                                    }
                                })
                                return res.status(200).send({
                                    msg: 'The user has been register with us!'
                                });
                            }
                        );
                    }
                })
            }
        }
    );
}

const verifyMail = (req, res) =>{
    var token = req.query.token;
    console.log(token)
    
    db.query(`SELECT * FROM users where token=? limit 1`, token, function(error, result, fields){
        if(error){
            console.log(error.message);
        }if(result.length > 0){
            db.query(`
                UPDATE users SET token = null ,is_verify = 1 WHERE id ='${result[0].id}'`);
                return res.render('mail-verification',{ message: 'Mail Verified Successfully! '});
        }
        else{
            return res.render('404');
        }
    })
}

const login =(req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()});
    }

    db.query(
        `
            SELECT * FROM users WHERE email = ${db.escape(req.body.email)};
        `,(err,result) =>{
            if(err) {
                return res.status(400).send({
                    msg:err
                });
            }
            if(!result.length) {
                return res.status(401).send({
                    msg: 'Email or Password is Incorrect'
                })
            }
            bcrypt.compare(
                req.body.password,
                result[0][ 'password'],
                (bErr, bResult) =>{
                    if(bErr) {
                        return res.status(400).send({
                            msg: bErr
                        });
                    }
                    if(bResult){
                        console.log(JWT_SECRET)
                        const token =
                        jwt.sign({ id:result[0]['id'], is_admin:result[0]['is_admin']},JWT_SECRET,{ expiresIn: '1d'});
                        db.query(`
                            UPDATE users SET last_login = now() WHERE id ='${result[0]['id']}'
                            `);
                            return res.status(200).send({
                                msg: "Logged In",
                                token,
                                user:result[0]
                            })
                    }
                    return  res.status(401).send({
                        msg: 'Email or Password is incorrect'
                    });
                }
            );
        }
    )
}

const getUser =(req, res) =>{
    const authToken = req.headers.authorization.split(' ')[1];
    const decode= jwt.verify(authToken,JWT_SECRET);


    db.query(`
            SELECT * FROM users WHERE id=?
        `, decode.id, function(error, result, fields){
            if(error) throw error;

            return res.status(200).send({ success: true, data: result[0], message: 'Fetch Successfully' });
        })
}

const forgetPassword = (req, res) => {
    console.log(158)
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    var email = req.body.email;
    db.query(`
            SELECT * FROM users WHERE email= ? limit 1
        `, email, function(error, result, fields){
            if(error) {
                return res.status(400).json({ message:error});
            }

            if(result.length > 0) {

                let mailSubject = 'Forget Password';
                const randomString = randomstring.generate();
                let content ='<p>Hii, '+result[0].name+' \
                Please <a href= "http://localhost:3000/reset-password?token='+randomString+'">Click Here</a> to Reset your Password <p>\
                ';

                sendMail(email, mailSubject, content);

                db.query(`
                        DELETE FROM password_resets WHERE email = ${db.escape(result[0].email)}
                    `);
                db.query(`
                        INSERT INTO password_resets (email, token) VALUES (${db.escape(result[0].email)}, '${randomString}')
                    `);
                    return res.status(200).send({
                         message: "Mail sent Successfully for Reset Password"
                    })
            };
            return res.status(402).send({
                message: "Mail doesn't exists"
            })
        });
}

const resetPasswordLoad = (req, res) => {
    try {
        var token = req.query.token;
        console.log(token)
        if(token == undefined) {
            res.render('404');
        }
        db.query(`
                SELECT * FROM password_resets where token= ? limit 1
            `, token, function(error, result, fields){
                if(error){
                    console.log(error)
                }
                if( result.length >0) {
                    db.query(`
                            SELECT * FROM users WHERE email = ? limit 1
                        `, result[0].email, function(error, result, fields){
                            if(error) {
                                console.log(error)
                            }
                            res.render('reset-password', { user: result[0]})
                        });
                }else {
                    res.render('404');
                }
            })
    } catch (error) {
        console.log(error.message)
    }
}

const resetPassword = (req, res) => {
    if(req.body.password != req.body.confirm_password){
        res.render('reset-password',{ error_message: 'Password not matching', user:{id:req.body.user_id, email:req.body.email} });
    }
    bcrypt.hash(req.body.confirm_password,10, (err, hash)=>{
        if(err) {
            console.log(err)
        }
        db.query(`
                DELETE FROM password_resets WHERE email ='${req.body.email}'
            `);
        db.query(`
                UPDATE users SET password ='${ hash }'WHERE id ='${req.body.user_id}'
            `);

             res.render('message', {message: 'Password Reset Successfully'})
    })
}

module.exports = { register, verifyMail, login, getUser, forgetPassword, resetPasswordLoad, resetPassword }