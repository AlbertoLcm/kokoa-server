const express = require('express');
const routes = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const promisePool = require('../database/dbPromise');

routes.get('/', async(req, res) => {
  try {
    const [patrocinadores] = await promisePool.query('SELECT * FROM patrocinadores');
    res.status(200).json(patrocinadores);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

routes.get('/:id', async(req, res) => {
  try {
    const [patrocinador] = await promisePool.query('SELECT * FROM patrocinadores WHERE id = ?', [req.params.id]);
    res.status(200).json(patrocinador[0]);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

routes.put('/:id', async(req, res) => {
  
  // filtro los datos vacios
  const datosFiltados = Object.keys(req.body).filter(key => req.body[key] === '');

  // elimino los datos vacios
  datosFiltados.forEach(key => delete req.body[key]);

  try {
    await promisePool.query('UPDATE patrocinadores SET ? WHERE id = ?', [req.body, req.params.id]);
  } catch (error) {
    res.status(400).json({message: 'Algo salio mal', error: error})
  }
});

// Ruta para búscar patrocinadores por el tipo
routes.post('/tipo', async(req, res) => {
  try {
    const [patrocinadores] = await promisePool.query('SELECT * FROM patrocinadores WHERE tipo = ?', [req.body.tipo]);

    if (!patrocinadores.length) {
      return res.status(400).json({ message: 'No se encontraron patrocinadores con ese tipo' });
    }
    
    res.status(200).json(patrocinadores);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para mostrar las reacciones de un patrocinador, recibe el id del patrocinador
routes.get('/reacciones/:id', async(req, res) => {
  try {
    // Usuarios normales y un negocio puede reaccionar a un patrocinador
    const [reacciones] = await promisePool.query('SELECT * FROM reacciones WHERE id_receptor = ? AND rol_receptor = "patrocinadores"', [req.params.id]);
    res.status(200).json(reacciones);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para añadir una reaccion a un patrocinador, recibe el id del patrocinador y el id del usuario
routes.post('/reacciones', async(req, res) => {
  const { id_negocio, id_usuario, rol_usuario, tipo, valuacion } = req.body;
  if(!id_negocio || !id_usuario, !rol_usuario) {
    return res.status(400).json({ message: 'Faltan datos' });
  }
  try {
    await promisePool.query('INSERT INTO reacciones SET ?', [{
      id_usuario: id_usuario,
      rol_usuario: rol_usuario,
      id_receptor: id_negocio,
      rol_receptor: 'patrocinadores',
      tipo: tipo,
      valuacion: valuacion
    }]);
    res.status(200).json({ message: 'Reaccion añadida' });
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

//  Ruta para editar una reaccion a un patrocinador, recibe el id del patrocinador y el id del usuario
routes.put('/reacciones/:id', async(req, res) => {
  const { id_negocio, id_usuario, rol_usuario, tipo, valuacion } = req.body;
  if(!id_negocio || !id_usuario, !rol_usuario) {
    return res.status(400).json({ message: 'Faltan datos' });
  }
  try {
    await promisePool.query('UPDATE reacciones SET ? WHERE id_usuario = ? AND rol_usuario = ? AND id_receptor = ? AND rol_receptor = ? AND tipo = ?', [{
      valuacion: valuacion
    }, id_usuario, rol_usuario, id_negocio, 'patrocinadores', tipo]);
    res.status(200).json({ message: 'Reaccion editada' });
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

module.exports = routes;
