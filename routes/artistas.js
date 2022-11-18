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

module.exports = routes;
