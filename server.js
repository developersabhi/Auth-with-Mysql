require("dotenv").config();


const express = require('express');
const cors = require('cors');

require('./config/dbConnection')

const app = express();

app.use(cors());

//error  handling

app.use((err, res, next)=>{
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal server error"
    res.status(err.statusCode).json({
        message:err.message,
    });
});

app.listen(3000, () => 
    console.log(`Server is runnig on port 3000`)
)