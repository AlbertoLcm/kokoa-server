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

// Ruta para mostrar los chats, recibe id del usuario y el rol del usuario
routes.get('/chats/:id/:rol', async (req, res) => {
  try {
    const [chats] = await promisePool.query('SELECT * FROM chats WHERE propietario = ? AND propietario_rol = ?', [req.params.id, req.params.rol]);
    res.status(200).json(chats);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para crear un chat
routes.post('/chats', async (req, res) => {
  try {
    const [chats] = await promisePool.query('INSERT INTO chats SET ?', [req.body]);
    res.status(200).json(chats);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});


module.exports = routes;