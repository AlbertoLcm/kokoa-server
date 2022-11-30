const express = require('express')
const routes = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const promisePool = require('../database/dbPromise')
const transporter = require('../helpers/configEmail')

// ======= Ruta para registrar un usuario =======
routes.post('/signup', async (req, res) => {

  const {nombre, apellidos, email, password} = req.body
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
    const [emailBD] = await promisePool.query('SELECT * FROM usuarios WHERE email = ?', [email.trim()]);
    if (emailBD.length) {
      return res.status(400).json({ message: 'El correo ya existe' })
    }
    const [telefonoBD] = await promisePool.query('SELECT * FROM usuarios WHERE telefono = ?', [telefono.trim()]);
    if (telefonoBD.length) {
      return res.status(400).json({ message: 'El telefono ya existe' })
    }
    // Paso 4 - Insertamos el usuario
    await promisePool.query('INSERT INTO usuarios SET ?', [{
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      password: req.body.password
    }]);
    // Paso 5 - Creamos el token con el usuario ingresado
    const [user] = await promisePool.query("SELECT * FROM usuarios WHERE email = ?", [email]);

    const token = await jwt.sign({
      id: user[0].id
    }, process.env.SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE });

    return res.cookie("token", token).json({
      success: true,
      message: "Registrado correctamente",
      user: {
        token: token,
        data: user[0]
      }
    });

  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
})
// ======= Fin de la ruta de registrar ======

routes.get('/:id', async(req, res) => {
  try {
    const [usuarios] = await promisePool.query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    res.json(usuarios[0])

  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error })
  }
});

routes.get('/', async(req, res) => {
  try {
    const [usuarios] = await promisePool.query('SELECT * FROM usuarios');
    res.json(usuarios)
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
    await promisePool.query('UPDATE usuarios SET ? WHERE id = ?', [req.body, req.params.id]);
    res.json({ message: 'Usuario actualizado' })
    
  } catch (error) {
    res.status(400).json({message: 'Algo salio mal', error: error})
  }
});

// Ruta para recuperar la contraseña
routes.post('/recuperar', async (req, res) => {
  const {email} = req.body
  // Paso 1 - Verificamos que ingresen todos los datos
  if (!email) {
    return res.status(400).json({ message: 'Debes ingresar un correo o teléfono' })
  }
  try {
    // Paso 2 - Verificamos si el correo existe
    const [usuario] = await promisePool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (!usuario.length) {
      return res.status(400).json({ message: 'El usuario no existe' })
    }

    // Paso 3 - Creamos un token con el usuario
    const token = await jwt.sign({id: usuario[0].id}, process.env.SECRET_KEY, {expiresIn: "10m"});

    // Paso 4 - Enviamos el correo
    await transporter.sendMail({
      from: '"Kokoa" <kokoafast@gmail.com>',
      to: ` ${email} `, 
      subject: 'Recupera tu contraseña',
      text: `https://kokoa.vercel.app/resetpassword/${usuario[0].id}/${token}`
    });
    
    return res.status(200).json({ message: 'Se ha enviado un email a tu correo' })

  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

// Ruta para resetear la contraseña
routes.post('/resetpassword/:id/:token', async (req, res) => {
  const {password} = req.body;
  const {id, token} = req.params;
  // Paso 1 - Verificamos que ingresen todos los datos
  if (!id || !token) {
    return res.status(400).json({ message: 'Acceso Denegado' })
  }
  if (!password) {
    return res.status(400).json({ message: 'Debes ingresar una contraseña' })
  }
  try {
    // Paso 2 - Verificamos si el token es valido
    const decoded = await jwt.verify(req.params.token, process.env.SECRET_KEY);
    if (!decoded) {
      return res.status(400).json({ message: 'El token es invalido' })
    }
    // Paso 3 - Hasheamos la contraseña
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(req.body.password, salt)
    req.body.password = hashPassword

    // Paso 4 - Actualizamos la contraseña
    await promisePool.query('UPDATE usuarios SET password = ? WHERE id = ?', [req.body.password, req.params.id]);

    return res.status(200).json({ message: 'Se ha actualizado la contraseña' })

  } catch (error) {
    return res.status(400).json({ message: 'Algo salio mal', error: error });
  }
});

module.exports = routes
