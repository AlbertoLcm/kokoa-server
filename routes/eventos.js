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
  let costo = req.body.datosEvento.costo;

  costo ? costo : costo = 0;

  // Verificamos que ingresen todos los datos
  if (!lat || !lng || !nombre, !fechaInicio || !horaIncio || !fechaTermino || !horaTermino || !descripcion) {
    return res.status(400).json({ message: 'Debes ingresar todos los datos' })
  }

  const fecha_inicio = `${fechaInicio} ${horaIncio}:00`
  const fecha_termino = `${fechaTermino} ${horaTermino}:00`

  try {

    const [insert] = await promisePool.query('INSERT INTO eventos SET ?', [{
      nombre: req.body.datosEvento.nombre,
      direccion: req.body.ubicacion,
      fecha_inicio: fecha_inicio,
      fecha_termino: fecha_termino,
      lat: req.body.lat,
      lng: req.body.lng,
      rol_anfitrion: req.body.rol,
      anfitrion: id,
      capacidad: req.body.datosEvento.capacidad,
      precio: costo,
      descripcion: req.body.datosEvento.descripcion,
      tipo: req.body.datosEvento.tipo,
      publico: req.body.datosEvento.publico,
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
    // });
    //     `,

    return res.status(201).json({ message: 'Evento registrado', insert: insert.insertId });

  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
})
// ======= Fin de la ruta de registrar ======

// Ruta para mostrar todos los eventos en general
routes.get('/', async (req, res) => {
  // TODO: La zona horaria es diferente en la base de datos, resto 6 horas para que coincida
  try {
    // Borramos los eventos que ya terminaron
    await promisePool.query('DELETE FROM eventos WHERE fecha_termino < DATE_ADD(now(), INTERVAL -6 HOUR) AND rol_anfitrion = "usuarios"');
    // Solo mandamos los eventos que no hayan terminado
    const [eventos] = await promisePool.query('SELECT * FROM eventos WHERE fecha_termino > DATE_ADD(now(), INTERVAL -6 HOUR) AND publico = 1');
    return res.status(200).json(eventos);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
})

// Ruta para mostrar los eventos que estan en curso
routes.get('/transcurso', async (req, res) => {
  try {
    const [eventos] = await promisePool.query('SELECT * FROM eventos WHERE fecha_inicio < DATE_ADD(now(), INTERVAL -6 HOUR) AND fecha_termino > DATE_ADD(now(), INTERVAL -6 HOUR) AND publico = 1');
    return res.status(200).json(eventos);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para mostrar eventos anteriores de un NEGOCIO, recibe el id del negocio
routes.get('/anteriores/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [eventosConluidos] = await promisePool.query('SELECT * FROM eventos WHERE fecha_termino < DATE_ADD(now(), INTERVAL -6 HOUR) AND rol_anfitrion = "negocios" AND anfitrion = ?', [id]);
    res.status(200).json(eventosConluidos)
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
});

// Ruta para mostrar eventos actuales de un NEGOCIO, recibe el id del negocio
routes.get('/actuales/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [eventosActuales] = await promisePool.query('SELECT * FROM eventos WHERE fecha_termino > DATE_ADD(now(), INTERVAL -6 HOUR) AND rol_anfitrion = "negocios" AND anfitrion = ?', [id]);
    res.status(200).json(eventosActuales)
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
});

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

  if (!id_evento || !id_usuario) {
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

// Ruta para eliminar asistentes al evento, recibe el id del evento y el id del usuario
routes.post('/ausentar', async (req, res) => {
  const { id_evento, id_usuario } = req.body;

  if (!id_evento || !id_usuario) {
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

// Comprobacion de asistencia, recibe el id del usuario
routes.get('/asistente/check/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'Se necesita el id del usuario' })
  }
  try {
    const [data] = await promisePool.query('SELECT * FROM asistentes WHERE id_usuario = ?', [id]);
    if(!data.length)  {
      return res.status(200).json({ message: 'No tiene eventos', data: data })
    }
    return res.status(200).json(data)
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
});

// Ruta para mostrar los eventos que asistira un usuario, recibe el id del usuario
routes.get('/asiste/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'Se necesita el id del usuario' })
  }
  try {
    const [eventos] = await promisePool.query('SELECT nombre, fecha_inicio, fecha_termino, direccion, eventos.id_evento FROM eventos JOIN asistentes ON asistentes.id_evento = eventos.id_evento WHERE asistentes.id_usuario = ? AND fecha_termino > DATE_ADD(now(), INTERVAL -6 HOUR)', [id]);
    if(!eventos.length)  {
      return res.status(200).json({ message: 'No tiene eventos' })
    }
    return res.status(200).json(eventos)
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
});

// Ruta para mostrar los eventos que ha creado un USUARIO
routes.get('/creados/usuario/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'Se necesita el id del usuario' })
  }
  try {
    const [eventos] = await promisePool.query('SELECT nombre, fecha_inicio, fecha_termino, direccion, id_evento FROM eventos WHERE anfitrion = ? AND rol_anfitrion = "usuarios" AND fecha_termino > DATE_ADD(now(), INTERVAL -6 HOUR)', [id]);
    if(!eventos.length)  {
      return res.status(200).json({ message: 'No tiene eventos' })
    }
    return res.status(200).json(eventos)
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
});
      

// Ruta para mostrar los comentarios de un evento, recibe el id del evento
routes.get('/comentarios/:id', async (req, res) => {
  try {
    const [comentarios] = await promisePool.query('SELECT * FROM comentarios_evento JOIN usuarios ON usuarios.id = comentarios_evento.id_usuario WHERE id_evento = ? AND rol_usuario = "usuarios" ORDER BY fecha DESC', [req.params.id]);
    const [comentariosNegocio] = await promisePool.query('SELECT * FROM comentarios_evento JOIN negocios ON negocios.id = comentarios_evento.id_usuario WHERE id_evento = ? AND rol_usuario = "negocios" ORDER BY fecha DESC', [req.params.id]);
    const [comentariosPatrocinador] = await promisePool.query('SELECT * FROM comentarios_evento JOIN patrocinadores ON patrocinadores.id = comentarios_evento.id_usuario WHERE id_evento = ? AND rol_usuario = "artistas" ORDER BY fecha DESC', [req.params.id]);
    const [comentariosArtista] = await promisePool.query('SELECT * FROM comentarios_evento JOIN artistas ON artistas.id = comentarios_evento.id_usuario WHERE id_evento = ? AND rol_usuario = "patrocinadores" ORDER BY fecha DESC', [req.params.id]);

    const comentariosFinal = comentarios.concat(comentariosNegocio, comentariosPatrocinador, comentariosArtista);

    // Ordenamos los comentarios por fecha
    comentariosFinal.sort((a, b) => {
      return new Date(b.fecha) - new Date(a.fecha);
    });
    
    res.status(200).json(comentariosFinal);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para añadir un comentario a un negocio, recibe el id del negocio y el id del usuario
routes.post('/comentarios', async (req, res) => {

  const { id_evento, id_usuario, comentario } = req.body;

  if (!id_evento || !id_usuario || !comentario) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    await promisePool.query('INSERT INTO comentarios_evento SET ?', [{
      id_evento: id_evento,
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

module.exports = routes
