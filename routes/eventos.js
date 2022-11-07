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

// Ruta para mostrar todos los eventos de un NEGOCIO, recibe el id del usuario 
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

module.exports = routes
