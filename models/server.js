const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');

class Server {
    constructor(){
        this.app = express();
        this.port = process.env.PORT;

        this.middlewares();
        this.routes();
    }

    middlewares(){
        // this.app.use(
        //     cors({
        //         origin: [`http://localhost:${this.port}`, 'https://kokoa-server.herokuapp.com']
        //     })
        //   );
        this.app.use(function (req, res, next) {

            // Website you wish to allow to connect
            res.setHeader('Access-Control-Allow-Origin', `http://localhost:3000`);
        
            // Request methods you wish to allow
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        
            // Request headers you wish to allow
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        
            // Set to true if you need the website to include cookies in the requests sent
            // to the API (e.g. in case you use sessions)
            res.setHeader('Access-Control-Allow-Credentials', true);
        
            // Pass to next layer of middleware
            next();
        });
        
        //Configuring cookie-parser
        this.app.use(cookieParser()); 
        // Lectura y parseo del body 
        this.app.use(express.json());
    }

    routes(){
        this.app.use('/api/auth', require('../routes/auth.js'));
        this.app.use('/api/usuarios', require('../routes/usuarios.js'));
        this.app.use('/api/artistas', require('../routes/artistas.js'));
        this.app.use('/api/negocios', require('../routes/negocios.js'));
        this.app.use('/api/patrocinadores', require('../routes/patrocinadores.js'));
        this.app.use('/api/eventos', require('../routes/eventos.js'));
    }

    listen(){
        this.app.listen(this.port, () => {
            console.log(`Servidor corriendo en http://localhost:${this.port}`)
        });
    }
}

module.exports = Server;