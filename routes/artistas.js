const express = require('express');
const routes = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const promisePool = require('../database/dbPromise');

routes.get('/', async(req, res) => {
  try {
    const [artistas] = await promisePool.query('SELECT * FROM artistas');
    res.status(200).json(artistas);
  } catch (error) {
    return req.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

routes.get('/:id', async(req, res) => {
  try {
    const [artista] = await promisePool.query('SELECT * FROM artistas WHERE id = ?', [req.params.id]);
    res.status(200).json(artista[0]);
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
    await promisePool.query('UPDATE artistas SET ? WHERE id = ?', [req.body, req.params.id]);
  } catch (error) {
    res.status(400).json({message: 'Algo salio mal', error: error})
  }
});

// Ruta para búscar artistas por el tipo
routes.post('/tipo', async(req, res) => {
  try {
    const [artistas] = await promisePool.query('SELECT * FROM artistas WHERE tipo = ?', [req.body.tipo]);
    
    if (!artistas.length) {
      return res.status(400).json({ message: 'No se encontraron artistas con ese tipo' });
    }
    
    res.status(200).json(artistas);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para mostrar las reacciones de un artista, recibe el id del artista
routes.get('/reacciones/:id', async(req, res) => {
  try {
    const [reacciones] = await promisePool.query('SELECT * FROM reacciones WHERE id_receptor = ? AND rol_receptor = "artistas"', [req.params.id]);
    res.status(200).json(reacciones);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para añadir una reaccion a un artista, recibe el id del artista y el id del usuario
routes.post('/reacciones', async(req, res) => {
  const { id_negocio, id_usuario, rol_usuario, tipo } = req.body;
  if(!id_negocio || !id_usuario, !rol_usuario) {
    return res.status(400).json({ message: 'Faltan datos' });
  }
  try {
    await promisePool.query('INSERT INTO reacciones SET ?', [{
      id_usuario: id_usuario,
      rol_usuario: rol_usuario,
      id_receptor: id_negocio,
      rol_receptor: 'artistas',
      tipo: tipo
    }]);
    res.status(200).json({ message: 'Reaccion añadida' });
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

module.exports = routes;
