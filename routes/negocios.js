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
    const [comentarios] = await promisePool.query('SELECT * FROM comentarios_negocio JOIN usuarios ON usuarios.id = comentarios_negocio.id_usuario WHERE id_negocio = ? AND rol_usuario = "usuarios" ORDER BY fecha DESC', [req.params.id]);
    const [comentariosNegocios] = await promisePool.query('SELECT * FROM comentarios_negocio JOIN negocios ON negocios.id = comentarios_negocio.id_usuario WHERE id_negocio = ? AND rol_usuario = "negocios" ORDER BY fecha DESC', [req.params.id]);
    const [comentariosPatrocinadores] = await promisePool.query('SELECT * FROM comentarios_negocio JOIN patrocinadores ON patrocinadores.id = comentarios_negocio.id_usuario WHERE id_negocio = ? AND rol_usuario = "patrocinadores" ORDER BY fecha DESC', [req.params.id]);
    const [comentariosArtistas] = await promisePool.query('SELECT * FROM comentarios_negocio JOIN artistas ON artistas.id = comentarios_negocio.id_usuario WHERE id_negocio = ? AND rol_usuario = "artistas" ORDER BY fecha DESC', [req.params.id]);

    const comentariosFinales = [...comentarios, ...comentariosNegocios, ...comentariosPatrocinadores, ...comentariosArtistas];
    
    // ordenamos los comentarios por fecha
    comentariosFinales.sort((a, b) => {
      return new Date(b.fecha) - new Date(a.fecha);
    });

    res.status(200).json(comentariosFinales);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para mostrar los COMENTARIOS DE LOS EVENTOS de un negocio, recibe el id del negocio
routes.get('/comentarios/eventos/:id', async(req, res) => {
  try {
    const [comentarios] = await promisePool.query('SELECT * FROM eventos JOIN comentarios_evento JOIN usuarios ON comentarios_evento.id_evento = eventos.id_evento AND comentarios_evento.id_usuario = usuarios.id AND comentarios_evento.rol_usuario = "usuarios" WHERE eventos.rol_anfitrion = "negocios" AND eventos.anfitrion = ? ORDER BY fecha DESC', [req.params.id]);
    const [comentariosNegocio] = await promisePool.query('SELECT * FROM eventos JOIN comentarios_evento JOIN negocios ON comentarios_evento.id_evento = eventos.id_evento AND comentarios_evento.id_usuario = negocios.id AND comentarios_evento.rol_usuario = "negocios" WHERE eventos.rol_anfitrion = "negocios" AND eventos.anfitrion = ? ORDER BY fecha DESC', [req.params.id]);
    const [comentariosPatrocinador] = await promisePool.query('SELECT * FROM eventos JOIN comentarios_evento JOIN patrocinadores ON comentarios_evento.id_evento = eventos.id_evento AND comentarios_evento.id_usuario = patrocinadores.id AND comentarios_evento.rol_usuario = "patrocinadores" WHERE eventos.rol_anfitrion = "negocios" AND eventos.anfitrion = ? ORDER BY fecha DESC', [req.params.id]);
    const [comentariosArtista] = await promisePool.query('SELECT * FROM eventos JOIN comentarios_evento JOIN artistas ON comentarios_evento.id_evento = eventos.id_evento AND comentarios_evento.id_usuario = artistas.id AND comentarios_evento.rol_usuario = "artistas" WHERE eventos.rol_anfitrion = "negocios" AND eventos.anfitrion = ? ORDER BY fecha DESC', [req.params.id]);

    const comentariosFinales = [...comentarios, ...comentariosNegocio, ...comentariosPatrocinador, ...comentariosArtista];

    // ordeno los comentarios por fecha
    comentariosFinales.sort((a, b) => {
      return new Date(b.fecha) - new Date(a.fecha);
    });
    
    res.status(200).json(comentariosFinales);
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
      comentario: comentario,
      rol_usuario: req.body.rol_usuario,
      fecha: new Date()
    }]);

    res.status(200).json({ message: 'Comentario añadido' });
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para mostrar las reacciones de un negocio, recibe el id del negocio
routes.get('/reacciones/:id', async(req, res) => {
  try {
    const [reacciones] = await promisePool.query('SELECT * FROM reacciones WHERE id_receptor = ? AND rol_receptor = "negocios"', [req.params.id]);
    res.status(200).json(reacciones);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para añadir una reaccion a un negocio, recibe el id del negocio y el id del usuario
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
      rol_receptor: 'negocios',
      tipo: tipo
    }]);
    res.status(200).json({ message: 'Reaccion añadida' });
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

module.exports = routes;
