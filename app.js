const express = require("express");
const bodyParser = require('body-parser');
require('dotenv').config()
var cors = require('cors')
const app = express();
require('./database/conn');

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin',process.env.FRONTEND_URL);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});


app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/uploads',express.static('uploads'));

app.use(require('./router/auth'));

app.listen((process.env.BACKEND_PORT),()=>{
    console.log("Server is running on the port number",(process.env.BACKEND_PORT));
});
