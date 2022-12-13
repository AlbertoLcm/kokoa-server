const express = require('express');
const promisePool = require('../database/dbPromise');
const routes = express.Router();

// Ruta para mostrar todos los mensajes de un chat, Recibe id del emisor, id del receptor y el rol del receptor
routes.get('/:emisor/:rol_e/:receptor/:rol_r', async (req, res) => {
  try {
    const [mensajes] = await promisePool.query('SELECT * FROM mensajes WHERE emisor = ? AND emisor_rol = ? AND receptor = ? AND receptor_rol = ?', [req.params.emisor, req.params.rol_e, req.params.receptor, req.params.rol_r]);
    res.status(200).json(mensajes);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para mostrar un chat
routes.get('/:id/:rol', async (req, res) => {
  const { id, rol } = req.params;
  
  try {
    const [chat] = await promisePool.query(`SELECT nombre, perfil, rol, id FROM ${rol} WHERE id = ?`, [id]);
    res.status(200).json(chat[0]);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para mostrar los chats, recibe id del usuario y el rol del usuario
routes.get('/chats/:id/:rol', async (req, res) => {
  try {
    const [artistas] = await promisePool.query('select artistas.id, nombre, perfil, rol from artistas join chats on artistas.id = chats.receptor and artistas.rol = chats.receptor_rol where chats.propietario = ? and chats.propietario_rol = ?', [req.params.id, req.params.rol]);
    const [patrocinadores] = await promisePool.query('select patrocinadores.id, nombre, perfil, rol from patrocinadores join chats on patrocinadores.id = chats.receptor and patrocinadores.rol = chats.receptor_rol where chats.propietario = ? and chats.propietario_rol = ?', [req.params.id, req.params.rol]);
    const [negocios] = await promisePool.query('select negocios.id, nombre, perfil, rol from negocios join chats on negocios.id = chats.receptor and negocios.rol = chats.receptor_rol where chats.propietario = ? and chats.propietario_rol = ?', [req.params.id, req.params.rol]);

    const chats = [...artistas, ...patrocinadores, ...negocios];
    
    res.status(200).json(chats);

  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para crear un chat
routes.post('/chats', async (req, res) => {
  try {
    await promisePool.query('INSERT INTO chats SET ?', [req.body]);
    res.status(200).json({ message: 'Chat creado' });
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para crear un mensaje
routes.post('/', async (req, res) => {
  const mensaje = req.body;
  let chatAdd = false;
  
  try {
    const [chat] = await promisePool.query('SELECT * FROM chats WHERE propietario = ? AND propietario_rol = ? AND receptor = ? AND receptor_rol = ?', [mensaje.emisor.id, mensaje.emisor.rol, mensaje.receptor.id, mensaje.receptor.rol]);

    if (!chat.length) {
      await promisePool.query('INSERT INTO chats SET ?', [{
        propietario: mensaje.emisor.id,
        propietario_rol: mensaje.emisor.rol,
        receptor: mensaje.receptor.id,
        receptor_rol: mensaje.receptor.rol,
      }]);
      await promisePool.query('INSERT INTO chats SET ?', [{
        propietario: mensaje.receptor.id,
        propietario_rol: mensaje.receptor.rol,
        receptor: mensaje.emisor.id,
        receptor_rol: mensaje.emisor.rol,
      }]);
      chatAdd = true;
    }
    
    await promisePool.query('INSERT INTO mensajes SET ?', [{
      mensaje: mensaje.mensaje,
      fecha: new Date(),
      origen: "envio",
      emisor: mensaje.emisor.id,
      emisor_rol: mensaje.emisor.rol,
      receptor: mensaje.receptor.id,
      receptor_rol: mensaje.receptor.rol,
    }]);
    
    await promisePool.query('INSERT INTO mensajes SET ?', [{
      mensaje: mensaje.mensaje,
      fecha: new Date(),
      origen: "recibo",
      emisor: mensaje.receptor.id,
      emisor_rol: mensaje.receptor.rol,
      receptor: mensaje.emisor.id,
      receptor_rol: mensaje.emisor.rol,
    }]);

    return res.status(200).json({ message: 'Mensaje enviado', chatAdd: chatAdd });
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

module.exports = routes;