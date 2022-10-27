const express = require('express')
const promisePool = require('../database/dbPromise')
const routes = express.Router()
const transporter = require('../helpers/configEmail')

// ======= Ruta para registrar un evento =======
routes.post('/add', async (req, res) => {
  let fechaInicio = req.body.datosEvento.fechaInicio
  let horaIncio = req.body.datosEvento.horaInicio
  let fechaTermino = req.body.datosEvento.fechaTermino
  let horaTermino = req.body.datosEvento.horaTermino

  const fecha_inicio = `${fechaInicio} ${horaIncio}:00`
  const fecha_termino = `${fechaTermino} ${horaTermino}:00`

  try {
    const { lat, lng, id } = req.body
    // Verificamos que ingresen todos los datos
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Debes ingresar todos los datos' })
    }

    await promisePool.query('INSERT INTO eventos SET ?', [{
      nombre: req.body.datosEvento.nombre,
      direccion: req.body.ubicacion,
      fecha_inicio: fecha_inicio,
      fecha_termino: fecha_termino,
      lat: req.body.lat,
      lng: req.body.lng,
      rol_anfitrion: req.body.rol,
      anfitrion: id
    }]);

    const [usuarios] = await promisePool.query('SELECT * FROM usuarios');

    // enviar correo a todos los usuarios
    // usuarios.forEach(async (usuario) => {
    //   await transporter.sendMail({
    //     from: '"Kokoa" <kokoafast@gmail.com>', // sender address
    //     to: usuario.email, // list of receivers
    //     subject: 'Evento cerca de ti!!!', // Subject line
    //     html: `
    //       <h1> Kokoa </h1>
    //       <h2> Hay un evento cercano y no estas ahí </h2>
    //       <h3> ${req.body.datosEvento.nombre} </h3>
    //       <p> Ubicado en ${req.body.ubicacion} </p>
    //       <a href="http://localhost:3000/"> Ver evento </a>
    //       `,
    //   })
    // });

    return res.status(200).json({ message: 'Evento registrado' })

  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal con la Query', error: error })
  }
})
// ======= Fin de la ruta de registrar ======

routes.get('/', async (req, res) => {
  try {
    const [eventosBD] = await promisePool.query('SELECT * FROM eventos')
    res.status(200).json(eventosBD)
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal con la Query', error: errBD })
  }
})

// Ruta para mostrar todos los eventos de un NEGOCIO, recibe el id del usuario 
routes.get('/all/:id', async (req, res) => {
  try {
    const [eventos] = await promisePool.query('SELECT * FROM eventos WHERE anfitrion = ? AND rol_anfitrion = "negocios"', [req.params.id])
    res.status(200).json(eventos)
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal con la Query', error: error })
  }
});

// Mostrar anfitrion de un evento, recibe el id del evento
routes.get('/:id', async(req, res) => {
  try {
    const [eventoBase] = await promisePool.query('SELECT * FROM eventos WHERE id_evento = ?', [req.params.id])
    const [anfitrion] = await promisePool.query(`SELECT * FROM ${eventoBase[0].rol_anfitrion} WHERE id = ?`, [eventoBase[0].anfitrion]);
    
    res.status(200).json(anfitrion[0])
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal con la Query', error: error })
  }
});

module.exports = routes
