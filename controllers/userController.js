const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs');

const db = require('../config/dbConnection');

const randomstring = require('randomstring');
const sendMail  = require('../helpers/sendMail')

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

module.exports = { register }