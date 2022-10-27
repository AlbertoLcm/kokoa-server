const express = require('express');
const routes = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const promisePool = require('../database/dbPromise');

// ======= Ruta para registrar un patrocinador =======
routes.post("/signup", async (req, res) => {
  try {
    const { nombre, email, telefono, password } = req.body;
    // Verificamos que ingresen todos los datos
    if (!nombre || !email || !telefono || !password) {
      return res.status(400).json({ message: 'Debes ingresar todos los datos' })
    }
    // Hasheamos la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    req.body.password = hashPassword;
    // Verificamos si existe el patrocinador en la BD
    req.getConnection((errBD, conn) => {
      if (errBD)
        return req.status(400).json({ message: 'Algo salio mal con la Query', error: errBD });

      conn.query('SELECT * FROM auth WHERE email = ?', [req.body.email], (err, results) => {
        if (err)
          return res.json({ message: 'Algo salio mal en la query', error: err.sqlMessage });

        if (!results.length) {
          conn.query('SELECT * FROM auth WHERE telefono = ?', [req.body.telefono], (err, results) => {
            if (err)
              return res.json({ message: 'Algo salio mal en la query', error: err.sqlMessage });

            if (!results.length) {
              conn.query('INSERT INTO auth SET ?', [
                {
                  email: req.body.email,
                  telefono: req.body.telefono,
                  password: req.body.password,
                  rol: req.body.rol
                }
              ], (err, result) => {
                if (err)
                  return res.json({ msg: err });

                conn.query('SELECT * FROM auth WHERE email = ?', [req.body.email], (err, auth) => {
                  if (err)
                    return res.json({ meesage: 'Algo salio mal con la query', err: err.sqlMessage })

                  conn.query('INSERT INTO patrocinadores SET ?', [
                    {
                      nombre: req.body.nombre,
                      ubicacion: req.body.direccion,
                      descripcion: req.body.descripcion,
                      auth: auth[0].id
                    }
                  ], (err, result) => {
                    if (err)
                      return res.json({ message: 'algo salio mal en la query', error: err.sqlMessage });

                    conn.query('SELECT * FROM patrocinadores JOIN auth ON patrocinadores.auth = auth.id WHERE auth.id = ?', [auth[0].id], async (err, user) => {
                      const token = await jwt.sign({
                        id: user.id
                      }, process.env.SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE });
                      return res.cookie('token', token).json({
                        success: true,
                        message: 'Patrocinador registrado',
                        user: {
                          token: token,
                          data: user
                        }
                      })
                    })
                  })
                });
              });
            } else {
              res.status(400).json({ message: 'El telefono ya existe' });
            }
          })
        } else {
          res.status(400).json({ message: 'El correo ya existe' })
        }
      })
    })
  } catch (error) {
    return res.json({ error: error });
  }
});
// ======= Fin de la ruta de registrar ======

routes.get('/', async(req, res) => {
  try {
    const [patrocinadores] = await promisePool.query('SELECT * FROM patrocinadores');
    res.status(200).json(patrocinadores);
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal con la Query', error: error });
  }
});

routes.delete('/:id', (req, res) => {
  req.getConnection((errBD, conn) => {
    if (errBD)
      return req.status(400).json({ message: 'Algo salio mal con la Query', error: errBD });

    conn.query('DELETE FROM patrocinadores WHERE id = ?', [req.params.id], (err, result) => {
      if (err)
        return res.send(err)

      res.status(200).json({ meesage: 'Patrocinador borrado' });
    });
  })
});

routes.put('/:id', (req, res) => {
  req.getConnection((errBD, conn) => {
    if (errBD)
      return req.status(400).json({ message: 'Algo salio mal con la Query', error: errBD });

    conn.query('UPDATE patrocinadores set ? WHERE id = ?', [
      req.body, req.params.id
    ], (err, result) => {
      if (err)
        return res.send(err)

      res.json({ status: '200 OK', descripcion: 'Patrocinador actualizado' });
    });
  })
});

module.exports = routes;
