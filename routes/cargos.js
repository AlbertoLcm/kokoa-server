const express = require('express');
const routes = express.Router();
const promisePool = require('../database/dbPromise.js');

// ======= Ruta para agregar un negocio a un usuario =======
routes.post('/negocio', async(req, res) => {
  let {lun1, lun2, mar1, mar2, mie1, mie2, jue1, jue2, vie1, vie2, sab1, sab2, dom1, dom2} = req.body;

  // concatenar variables
  let horario = `${lun1} - ${lun2}, ${mar1} - ${mar2}, ${mie1} - ${mie2}, ${jue1} - ${jue2}, ${vie1} - ${vie2}, ${sab1} - ${sab2}, ${dom1} - ${dom2}`;
  
  try {
    await promisePool.query('INSERT INTO negocios SET ?', [{
      nombre: req.body.negocio.nombre,
      direccion: req.body.direccion,
      horario: horario,
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