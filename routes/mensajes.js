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

module.exports = routes;