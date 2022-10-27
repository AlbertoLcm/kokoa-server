const express = require('express')
const routes = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const promisePool = require('../database/dbPromise')

// ======= Ruta para registrar un usuario =======
routes.post('/signup', async (req, res) => {

  const {nombre, apellidos, email, telefono, password} = req.body
  // Paso 1 - Verificamos que ingresen todos los datos
  if (!nombre || !apellidos || !email || !telefono || !password) {
    return res.status(400).json({ message: 'Debes ingresar todos los datos' })
  }
  // Paso 2 - Hasheamos la contraseña
  const salt = await bcrypt.genSalt(10)
  const hashPassword = await bcrypt.hash(req.body.password, salt)
  req.body.password = hashPassword

  try {
    // Paso 3 - Verificamos si el correo y el telefono existe
    const [emailBD] = await promisePool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (emailBD.length) {
      return res.status(400).json({ message: 'El correo ya existe' })
    }
    const [telefonoBD] = await promisePool.query('SELECT * FROM usuarios WHERE telefono = ?', [telefono]);
    if (telefonoBD.length) {
      return res.status(400).json({ message: 'El telefono ya existe' })
    }
    // Paso 4 - Insertamos el usuario
    const [insert] = await promisePool.query('INSERT INTO usuarios SET ?', [req.body]);
    // Paso 5 - Creamos el token con el usuario ingresado
    const [user] = await promisePool.query('SELECT * FROM usuarios WHERE id = ?', [insert.insertId]);

    const token = await jwt.sign({
      id: user.id
    }, process.env.SECRET_KEY, {
      expiresIn: process.env.JWT_EXPIRE
    },)

    return res.cookie('token', token).json({
      success: true,
      message: 'Usuario registrado',
      user: {
        token: token,
        data: user[0]
      }
    });
  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal con la Query', error: error })
  }
})
// ======= Fin de la ruta de registrar ======

routes.get('/', async(req, res) => {
  try {
    const [usuarios] = await promisePool.query('SELECT * FROM usuarios');
    
    res.json(usuarios)

  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal con la Query', error: error })
  }
})

module.exports = routes
