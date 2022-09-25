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
        this.app.use(cors());
        // Configurar cabeceras y cors
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
            res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
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
    }

    listen(){
        this.app.listen(this.port, () => {
            console.log(`Servidor corriendo en http://localhost:${this.port}`)
        });
    }
}

module.exports = Server;