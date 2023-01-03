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
      socket.on('busqueda', async (data) => {
        // si data esta vacio, no hacemos nada
        if (data === '') {
          return this.io.to(socket.id).emit('busqueda', []);
        };
        // Buscamos en la base de datos
        const [patrocinadores] = await promisePool.query(`SELECT nombre, id, perfil, rol FROM patrocinadores WHERE nombre LIKE '%${data}%'`);
        const [artistas] = await promisePool.query(`SELECT nombre, id, perfil, rol FROM artistas WHERE nombre LIKE '%${data}%'`);
        const datos = [...patrocinadores, ...artistas]
        // Emitimos los datos a un unico cliente
        this.io.to(socket.id).emit('busqueda', datos);
      });
      socket.on('busqueda-kokoa', async (data) => {
        // si data esta vacio, no hacemos nada
        if (data === '') {
          return this.io.to(socket.id).emit('busqueda-kokoa', { negocios: [], eventos: [] });
        };
        // Buscamos en la base de datos
        const [negocios] = await promisePool.query(`SELECT nombre, id, perfil FROM negocios WHERE nombre LIKE '%${data}%'`);
        const [eventos] = await promisePool.query(`SELECT nombre, id_evento FROM eventos WHERE nombre LIKE '%${data}%' AND fecha_termino > DATE_ADD(now(), INTERVAL -6 HOUR) AND publico = 1`);
        // Emitimos los datos a un unico cliente
        this.io.to(socket.id).emit('busqueda-kokoa', { negocios, eventos });
      })
      // Cuando un usuario comenta algo
      socket.on("comentar", (data) => {
        this.io.emit("new-comentario", data);
      });
      // Cuando se crea un nuevo evento
      socket.on("evento", (data) => {
        this.io.emit("new-evento", data);
      });
      // Chats
      socket.on('new-chat', (data) => {
        this.io.to(socket.id).emit('new-chat', data);
        this.io.emit(`new-chat-to-${data.receptor.id}-${data.receptor.rol}`, data);
      });
      socket.on('send-message', (mensaje) => {
        this.io.emit(`new-from-${mensaje.emisor.id}-${mensaje.emisor.rol}-to-${mensaje.receptor.id}-${mensaje.receptor.rol}`, mensaje.mensaje);
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
    this.app.use('/api/busquedas', require('../routes/busquedas.js'));
  }

  listen() {
    this.server.listen(this.port, () => {
      console.log(`Servidor corriendo en http://localhost:${this.port}`)
    });
  }
}

module.exports = ServerClass;
