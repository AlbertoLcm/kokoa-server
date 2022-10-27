const jwt = require('jsonwebtoken');
const { request, response } = require('express');
const promisePool = require('../database/dbPromise.js');
const isAuthenticated = async (req = request, res = response, next) => {
  try {
    const token = req.headers["authorization"];
    // const { token } = req.cookies;
    if (!token) {
      return res.status(400).json({ message: 'No hay un token' });
    }
    const verify = await jwt.verify(token, process.env.SECRET_KEY);
    const [usuario] = await promisePool.query('SELECT * FROM usuarios WHERE id = ?', [verify.id]);
    if (usuario.length) {
      return next();
    }
  } catch (error) {
    res.status(400).json({ message: 'Acceso denegado' })
    return next(error);
  }
}

module.exports = isAuthenticated;
