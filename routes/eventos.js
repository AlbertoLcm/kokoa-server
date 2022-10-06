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
    const { lat, lng } = req.body
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
                },
              ],
              (err, result) => {
                if (err) return res.json({ msg: err })

                // enviar correo a todos los usuarios
                conn.query(
                  'SELECT * FROM usuarios JOIN auth WHERE usuarios.auth = auth.id',
                  (err, usuarios) => {
                    if (err) return res.json({ msg: err })

                    usuarios.forEach(async (usuario) => {
                      await transporter.sendMail({
                        from: '"Kokoa" <kokoafast@gmail.com>', // sender address
                        to: usuario.email, // list of receivers
                        subject: 'Evento cerca de ti!!!', // Subject line
                        html: `
                      <h1> Kokoa </h1>
                      <h2> Hay un evento cercano y no estas ahí </h2>
                      <h3> ${req.body.datosEvento.nombre} </h3>
                      <p> Ubicado en ${req.body.ubicacion} </p>
                      <a href="https://kokoafast.herokuapp.com"> Ver evento </a>
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

    conn.query('SELECT * FROM eventos', (err, result) => {
      if (err) return res.send(err)

      res.json(result)
    })
  })
})

routes.put('/:id', (req, res) => {
  req.getConnection((errBD, conn) => {
    if (errBD)
      return req
        .status(400)
        .json({ message: 'Algo salio mal con la Query', error: errBD })

    conn.query(
      'UPDATE usuarios set ? WHERE id = ?',
      [req.body, req.params.id],
      (err, result) => {
        if (err) return res.send(err)

        res.json({ status: '200 OK', descripcion: 'Usuario actualizado' })
      },
    )
  })
})

module.exports = routes
