const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const myConnection = require('express-myconnection');
const dbOptions = require('../database/db.js');
const socketIo = require('socket.io');
const promisePool = require('../database/dbPromise.js');

class ServerClass {
  constructor() {
    this.app = express();
    this.port = process.env.PORT;
    this.middlewares();
    this.routes();
    this.server = require("http").Server(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
      }
    });
    this.io.on("connection", (socket) => {
      socket.on('send-message', async (mensaje) => {
        await promisePool.query('INSERT INTO mensajes SET ?', [{
          mensaje: mensaje.mensaje,
          fecha: new Date(),
          origen: "envio",
          emisor: mensaje.emisor,
          emisor_rol: mensaje.emisor_rol,
          receptor: mensaje.receptor.id,
          receptor_rol: mensaje.receptor.rol,
        }]);

        this.io.sockets.emit(`new-from-${mensaje.emisor}-to-${mensaje.receptor.id}-${mensaje.receptor.rol}`, mensaje.mensaje);

        await promisePool.query('INSERT INTO mensajes SET ?', [{
          mensaje: mensaje.mensaje,
          fecha: new Date(),
          origen: "recibo",
          emisor: mensaje.receptor.id,
          emisor_rol: mensaje.receptor.rol,
          receptor: mensaje.emisor,
          receptor_rol: mensaje.emisor_rol,
        }]);
      });
    });
  }

  async middlewares() {
    this.app.use(myConnection(mysql, dbOptions, 'request'));
    this.app.use(cors());
    // Configuring cookie-parser
    this.app.use(cookieParser());
    // Lectura y parseo del body
    this.app.use(express.json());
  }

  routes() {
    this.app.use('/api/auth', require('../routes/auth.js'));
    this.app.use('/api/usuarios', require('../routes/usuarios.js'));
    this.app.use('/api/artistas', require('../routes/artistas.js'));
    this.app.use('/api/negocios', require('../routes/negocios.js'));
    this.app.use('/api/patrocinadores', require('../routes/patrocinadores.js'));
    this.app.use('/api/eventos', require('../routes/eventos.js'));
    this.app.use('/api/upload', require('../routes/upload.js'));
    this.app.use('/api/cargos', require('../routes/cargos.js'));
    this.app.use('/api/mensajes', require('../routes/mensajes.js'));
  }

  listen() {
    this.server.listen(this.port, () => {
      console.log(`Servidor corriendo en http://localhost:${this.port}`)
    });
  }
}

module.exports = ServerClass;
