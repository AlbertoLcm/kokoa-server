const express = require('express');
const routes = express.Router();
const promisePool = require('../database/dbPromise.js');

// ======= Ruta para agregar un negocio a un usuario =======
routes.post('/negocio', async(req, res) => {
  let {Lun1, Lun2, Mar1, Mar2, Mie1, Mie2, Jue1, Jue2, Vie1, Vie2, Sab1, Sab2, Dom1, Dom2} = req.body.negocio;
  let horario = `${Lun1} - ${Lun2}, ${Mar1} - ${Mar2}, ${Mie1} - ${Mie2}, ${Jue1} - ${Jue2}, ${Vie1} - ${Vie2}, ${Sab1} - ${Sab2}, ${Dom1} - ${Dom2}`;
  
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