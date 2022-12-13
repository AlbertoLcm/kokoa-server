const express = require('express');
const routes = express.Router();
const promisePool = require('../database/dbPromise');

routes.get('/general/:data', async (req, res) => {
  const { data } = req.params;
  try {
    const [datos] = await promisePool.query(`SELECT id, nombre, rol, perfil FROM patrocinadores WHERE nombre LIKE '%${data}%'`);
    if (!datos.length) {
      return res.status(400).json({ message: 'No se encontraron resultados' });
    }
    res.status(200).json(datos);

  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

module.exports = routes;

