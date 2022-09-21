const express = require('express');
const mysql = require('mysql');
const myconn = require('express-myconnection');
const routes = require('./routes.js');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT;

// Middlewares..
    const dbOptions = {
        host: 'us-cdbr-east-06.cleardb.net',
        port: '3306',
        database: 'heroku_75d7d8951a75510',
        user: 'b45a2eec4d6249',
        password: 'f1419041'
    };
    app.use(myconn(mysql, dbOptions, 'single'));

    app.use(cors());
    
    // Lectura y parseo del body 
    app.use(express.json())
// Fin Middlewares..

app.use(express.static('build'));

// Routes..
    app.use('/api', routes)

    app.listen(port, () => {
        console.log(`Servidor corriendo en http://localhost:${port}`)
    });