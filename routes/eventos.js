const express = require('express')
const routes = express.Router()
const transporter = require('../helpers/configEmail')

// ======= Ruta para registrar un evento =======
routes.post('/add', (req, res) => {
  let fechaInicio = req.body.datosEvento.fechaInicio
  let horaIncio = req.body.datosEvento.horaIncio
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
    req.getConnection((errBD, conn) => {
      if (errBD)
        return res
          .status(400)
          .json({ message: 'Algo salio mal con la Query', error: errBD })

      conn.query(
        'SELECT * FROM eventos where lat = ? and lng = ?',
        [req.body.lat, req.body.lng],
        (err, eventos) => {
          if (err)
            return res
              .status(400)
              .json({ message: 'algo salio mal con la query', error: err })

          if (!eventos.length) {
            conn.query(
              'INSERT INTO eventos SET ?',
              [
                {
                  nombre: req.body.datosEvento.nombre,
                  ubicacion: req.body.ubicacion,
                  fecha_inicio: fecha_inicio,
                  fecha_termino: fecha_termino,
                  lat: req.body.lat,
                  lng: req.body.lng,
                  anfitrion: id,
                },
              ],
              (err, result) => {
                if (err) return res.json({ msg: err })

                conn.query(
                  'SELECT * FROM usuarios JOIN auth WHERE usuarios.auth = auth.id',
                  (err, usuarios) => {
                    if (err) return res.json({ msg: err })
                      // enviar correo a todos los usuarios
                      usuarios.forEach(async(usuario) => {
                        await transporter.sendMail({
                          from: '"Kokoa" <kokoafast@gmail.com>', // sender address
                          to: usuario.email, // list of receivers
                          subject: 'Evento cerca de ti!!!', // Subject line
                          html: `
                            <h1> Kokoa </h1>
                            <h2> Hay un evento cercano y no estas ahí </h2>
                            <h3> ${req.body.datosEvento.nombre} </h3>
                            <p> Ubicado en ${req.body.ubicacion} </p>
                            <a href="http://localhost:3000/"> Ver evento </a>
                          `, // html body
                        })
                      })
                  },
                )
                return res.status(200).json({ message: 'Evento registrado' })
              },
            )
          } else {
            return res
              .status(400)
              .json({ message: 'Ya hay un evento en ese lugar :c' })
          }
        },
      )
    })
  } catch (error) {
    return res.json({ error: error })
  }
})
// ======= Fin de la ruta de registrar ======

routes.get('/', (req, res) => {
  req.getConnection((errBD, conn) => {
    if (errBD)
      return res
        .status(400)
        .json({ message: 'Algo salio mal con la Query', error: errBD })

    conn.query('SELECT * FROM eventos JOIN auth ON eventos.anfitrion = auth.id', (err, eventosBD) => {
      if (err) return res.send(err)

      res.status(200).json(eventosBD)
    })
  })
})

// Ruta para mostrar eventos de un negocio
routes.get('/all/:id', (req, res) => {
  req.getConnection((errBD, conn) => {
    if (errBD)
      return res
        .status(400)
        .json({ message: 'Algo salio mal con la Query', error: errBD })


    conn.query(
      'SELECT * FROM eventos JOIN auth ON eventos.anfitrion = auth.id WHERE eventos.anfitrion = ?',
      [req.params.id],
      (err, eventoBD) => {
        if (err) return res.send(err)

        res.status(200).json(eventoBD)
      },
    )
  })
});

// Mostrar anfitrion de un evento
routes.get('/:id', (req, res) => {
  req.getConnection((errBD, conn) => {
    if (errBD)
      return res
        .status(400)
        .json({ message: 'Algo salio mal con la Query', error: errBD })


    conn.query(
      'SELECT * FROM eventos JOIN auth ON eventos.anfitrion = auth.id WHERE eventos.id_evento = ?',
      [req.params.id],
      (err, eventoBD) => {
        if (err) return res.send(err)

        conn.query(`SELECT * FROM ${eventoBD[0].rol} WHERE auth = ?`, [eventoBD[0].anfitrion], (err, anfitrionBD) => {
          if (err) return res.status(400).json({ message: 'Algo salio mal con la Query', error: err })
          
          res.status(200).json(anfitrionBD[0])
        });
      },
    )
  })
});

module.exports = routes
