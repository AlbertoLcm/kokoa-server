const express = require('express')
const promisePool = require('../database/dbPromise')
const routes = express.Router()
// const transporter = require('../helpers/configEmail')

// ======= Ruta para registrar un evento =======
routes.post('/add', async (req, res) => {
  const { lat, lng, id } = req.body;
  const nombre = req.body.datosEvento.nombre;
  let fechaInicio = req.body.datosEvento.fechaInicio;
  let horaIncio = req.body.datosEvento.horaInicio;
  let fechaTermino = req.body.datosEvento.fechaTermino;
  let horaTermino = req.body.datosEvento.horaTermino;
  const descripcion = req.body.datosEvento.descripcion;
  
  // Verificamos que ingresen todos los datos
  if (!lat || !lng || !nombre, !fechaInicio || !horaIncio || !fechaTermino || !horaTermino || !descripcion) {
    return res.status(400).json({ message: 'Debes ingresar todos los datos' })
  }

  const fecha_inicio = `${fechaInicio} ${horaIncio}:00`
  const fecha_termino = `${fechaTermino} ${horaTermino}:00`

  try {

    await promisePool.query('INSERT INTO eventos SET ?', [{
      nombre: req.body.datosEvento.nombre,
      direccion: req.body.ubicacion,
      fecha_inicio: fecha_inicio,
      fecha_termino: fecha_termino,
      lat: req.body.lat,
      lng: req.body.lng,
      rol_anfitrion: req.body.rol,
      anfitrion: id,
      capacidad: req.body.datosEvento.capacidad,
      precio: req.body.datosEvento.costo,
      descripcion: req.body.datosEvento.descripcion,
      tipo: req.body.datosEvento.tipo,
    }]);

    // TODO: Arreglar servidor de correo
    
    // // enviar correo a todos los usuarios
    // const [usuarios] = await promisePool.query('SELECT * FROM usuarios');
    // let emails = usuarios.map(usuario => {
    //   return usuario.email;
    // })

    // await transporter.sendMail({
    //   from: '"Kokoa" <kokoafast@gmail.com>', // sender address
    //   to: ` ${emails} `, // list of receivers
    //   subject: 'Evento cerca de ti!!!', // Subject line
    //   html: `
    //     <h1> Kokoa </h1>
    //     <h2> Hay un evento cercano y no estas ahí </h2>
    //     <h3> ${req.body.datosEvento.nombre} </h3>
    //     <p> Ubicado en ${req.body.ubicacion} </p>
    //     `,
    // });

    return res.status(201).json({ message: 'Evento registrado' })

  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
})
// ======= Fin de la ruta de registrar ======

// Ruta para mostrar todos los eventos en general
routes.get('/', async (req, res) => {
  try {
    const [eventosBD] = await promisePool.query('SELECT * FROM eventos')
    res.status(200).json(eventosBD)
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: errBD })
  }
})

// Ruta para mostrar todos los eventos de un NEGOCIO, recibe el id del negocio
routes.get('/all/:id', async (req, res) => {
  try {
    const [eventos] = await promisePool.query('SELECT * FROM eventos WHERE anfitrion = ? AND rol_anfitrion = "negocios"', [req.params.id])
    res.status(200).json(eventos)
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
});

// Mostrar anfitrion de un evento, recibe el id del evento
routes.get('/:id', async (req, res) => {
  try {
    const [eventoBase] = await promisePool.query('SELECT * FROM eventos WHERE id_evento = ?', [req.params.id])
    const [anfitrion] = await promisePool.query(`SELECT * FROM ${eventoBase[0].rol_anfitrion} WHERE id = ?`, [eventoBase[0].anfitrion]);
    return res.status(200).json(anfitrion[0])
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
});

// Ruta para mostrar un evento en especifico, recibe el id del evento
routes.get('/evento/:id', async (req, res) => {
  try {
    const [evento] = await promisePool.query('SELECT * FROM eventos WHERE id_evento = ?', [req.params.id])
    if (!evento.length) {
      return res.status(400).json({ message: 'No se encontro el evento' })
    }
    return res.status(200).json(evento[0])
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
});

// Ruta para agregar asistentes al evento, recibe el id del evento y el id del usuario
routes.post('/asistente', async (req, res) => {
  const { id_evento, id_usuario } = req.body;

  if(!id_evento || !id_usuario) {
    return res.status(400).json({ message: 'Se necesita el id del evento y usuario' })
  }
  
  try {
    await promisePool.query('INSERT INTO asistentes SET ?', [req.body]);
    const [data] = await promisePool.query('UPDATE eventos SET asistentes_cont = asistentes_cont + 1 WHERE id_evento = ?', [id_evento]);
    
    return res.status(201).json({ message: 'Asistente agregado', inf: data })
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
});

// Ruta para agregar asistentes al evento, recibe el id del evento y el id del usuario
routes.post('/ausentar', async (req, res) => {
  const { id_evento, id_usuario } = req.body;

  if(!id_evento || !id_usuario) {
    return res.status(400).json({ message: 'Se necesita el id del evento y usuario' })
  }
  
  try {
    await promisePool.query('DELETE FROM asistentes WHERE id_usuario = ? AND id_evento = ?', [id_usuario, id_evento]);
    const [data] = await promisePool.query('UPDATE eventos SET asistentes_cont = asistentes_cont - 1 WHERE id_evento = ?', [id_evento]);
    
    return res.status(201).json({ message: 'Asistente agregado', inf: data })
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
});

// Comprobacion de asistencia, recibe el id del evento y el id del usuario
routes.post('/asistente/check', async (req, res) => {
  const { id_usuario } = req.body;

  if(!id_usuario) {
    return res.status(400).json({ message: 'Se necesita el id del usuario' })
  }
  
  try {
    const [data] = await promisePool.query('SELECT * FROM asistentes WHERE id_usuario = ?', [id_usuario]);
    return res.status(200).json(data)
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
});

// Ruta para mostrar los comentarios de un evento, recibe el id del evento
routes.get('/comentarios/:id', async(req, res) => {
  try {
    const [comentarios] = await promisePool.query('SELECT * FROM comentarios_evento JOIN usuarios ON comentarios_evento.id_usuario = usuarios.id WHERE id_evento = ?', [req.params.id]);
    
    // Ordenamos los comentarios por fecha
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

  const { id_evento, id_usuario, comentario } = req.body.comentarioEvento;

  if(!id_evento || !id_usuario || !comentario) {
    return res.status(400).json({ message: 'Faltan datos' });
  }
  
  try {
    await promisePool.query('INSERT INTO comentarios_evento SET ?', [{
      id_evento: id_evento,
      id_usuario: id_usuario,
      comentario: comentario,
      fecha: req.body.fecha
    }]);
    res.status(200).json({ message: 'Comentario añadido' });
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

module.exports = routes
