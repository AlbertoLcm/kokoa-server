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

module.exports = routes;
