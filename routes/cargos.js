const express = require('express');
const routes = express.Router();
const promisePool = require('../database/dbPromise.js');

// ======= Ruta para agregar un negocio a un usuario =======
routes.post('/negocio', async(req, res) => {
  try {
    await promisePool.query('INSERT INTO negocios SET ?', [{
      nombre: req.body.negocio.nombre,
      direccion: req.body.negocio.direccion,
      horario: req.body.negocio.horario,
      id_usuario: req.body.id
    }]);
    res.status(200).json({ message: "Negocio creado correctamente" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

routes.get('/', async(req, res) => {
  try {
    const [rows, fields] = await promisePool.query('SELECT * FROM negocios');
    res.status(200).json(rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = routes;