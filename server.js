require("dotenv").config();


const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('./config/dbConnection')

const userRouter  = require('./routes/userRoute.js')
const webRouter  = require('./routes/webRoute.js')


const app = express();

app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true})) // what is work of extended true ???

app.use(cors());

app.use('/api',userRouter)
app.use('/',webRouter)

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