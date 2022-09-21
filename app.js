const express = require('express');
const mysql = require('mysql');
const myconn = require('express-myconnection');
const routes = require('./routes.js');
const cors = require('cors');

const app = express();
app.set('port', process.env.PORT || 8081);

// Middlewares..
    const dbOptions = {
        host: 'localhost',
        port: '3306',
        database: 'kokoa',
        user: 'root',
        password: ''
    };
    app.use(myconn(mysql, dbOptions, 'single'));

    app.use(cors());
    
    // Lectura y parseo del body 
    app.use(express.json())
// Fin Middlewares..

app.use(express.static('build'));

// Routes..
    app.get('', (req, res) => {
        res.send('Bienvenido a MyAPI by LCM');
    });
    app.use('/api', routes)

    app.listen(app.get('port'), () => {
        ;console.log(`Servidor corriendo en http://localhost:8081`)
    });