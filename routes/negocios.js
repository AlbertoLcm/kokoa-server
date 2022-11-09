const express = require('express');
const routes = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const promisePool = require('../database/dbPromise');

routes.get('/', async(req, res) => {
  try {
    const [negocios] = await promisePool.query('SELECT * FROM negocios');
    res.status(200).json(negocios);
  } catch (error) {
    return req.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Mostrar negocio, recibe el id del negocio
routes.get('/:id', async(req, res) => {
  try {
    const [negocio] = await promisePool.query(`SELECT * FROM negocios WHERE id = ?`, [req.params.id]);
    
    res.status(200).json(negocio[0])
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
});

routes.put('/:id', async(req, res) => {
  
  // filtro los datos vacios
  const datosFiltados = Object.keys(req.body).filter(key => req.body[key] === '');

  // elimino los datos vacios
  datosFiltados.forEach(key => delete req.body[key]);

  try {
    await promisePool.query('UPDATE negocios SET ? WHERE id = ?', [req.body, req.params.id]);
  } catch (error) {
    res.status(400).json({message: 'Algo salio mal', error: error})
  }
});

// Ruta para mostrar los comentarios de un negocio, recibe el id del negocio
routes.get('/comentarios/:id', async(req, res) => {
  try {
    const [comentarios] = await promisePool.query('SELECT * FROM comentarios_negocio JOIN usuarios ON comentarios_negocio.id_usuario = usuarios.id WHERE id_evento = ?', [req.params.id]);

    // ordenamos los comentarios por fecha
    comentarios.sort((a, b) => {
      return new Date(b.fecha) - new Date(a.fecha);
    });
      
    res.status(200).json(comentarios);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para añadir un comentario a un negocio, recibe el id del negocio y el id del usuario
routes.post('/comentarios', async(req, res) => {

  const { id_negocio, id_usuario, comentario } = req.body.comentario;

  if(!id_negocio || !id_usuario || !comentario) {
    return res.status(400).json({ message: 'Faltan datos' });
  }
  
  try {
    await promisePool.query('INSERT INTO comentarios_negocio SET ?', [{
      id_negocio: id_negocio,
      id_usuario: id_usuario,
      comentario: comentario,
      fecha: req.body.fecha
    }]);

    res.status(200).json({ message: 'Comentario añadido' });
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

module.exports = routes;
