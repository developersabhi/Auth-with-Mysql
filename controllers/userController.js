const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs');

const db = require('../config/dbConnection');

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
                            `INSERT INTO users (name, email, password) VALUES ('${req.body.name}', ${db.escape(req.body.email)},${db.escape(hash)});`,
                            (err, result) => {
                                if(err) {
                                    return res.status(400).send({
                                        msg: err
                                    });
                                }
                                return res.status(500).send({
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