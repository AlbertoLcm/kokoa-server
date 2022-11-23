const express = require('express');
const routes = express.Router();
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
    const [comentarios] = await promisePool.query('SELECT * FROM comentarios_negocio WHERE id_negocio = ?', [req.params.id]);

    // ordenamos los comentarios por fecha
    comentarios.sort((a, b) => {
      return new Date(b.fecha) - new Date(a.fecha);
    });
      
    res.status(200).json(comentarios);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para mostrar los COMENTARIOS DE LOS EVENTOS de un negocio, recibe el id del negocio
routes.get('/comentarios/eventos/:id', async(req, res) => {
  try {
    const [comentarios] = await promisePool.query('SELECT * FROM eventos JOIN comentarios_evento ON comentarios_evento.id_evento = eventos.id_evento WHERE eventos.rol_anfitrion = "negocios" AND eventos.anfitrion = ? ORDER BY fecha DESC', [req.params.id]);
    res.status(200).json(comentarios);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para añadir un comentario a un negocio, recibe el id del negocio y el id del usuario
routes.post('/comentarios', async(req, res) => {

  const { id_negocio, id_usuario, comentario } = req.body;

  if(!id_negocio || !id_usuario || !comentario) {
    return res.status(400).json({ message: 'Faltan datos' });
  }
  
  try {
    await promisePool.query('INSERT INTO comentarios_negocio SET ?', [{
      id_negocio: id_negocio,
      id_usuario: id_usuario,
      perfil: req.body.perfil,
      nombre: req.body.nombre,
      comentario: comentario,
      fecha: new Date()
    }]);

    res.status(200).json({ message: 'Comentario añadido' });
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

module.exports = routes;
