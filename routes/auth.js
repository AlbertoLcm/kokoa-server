const express = require('express');
const routes = express.Router();
const conexion = require('../database/db.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const isAuthenticated = require('../middleware/autenticacion.js');

// ======= Ruta para hacer login a cualquier usuario =======
routes.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Verificamos que ingresen datos
        if (!email || !password) {
            return res.status(400).json({ message: 'Debes ingresar todos los datos' })
        }
        // Verificamos si el usuario existe
        conexion.query(`SELECT * FROM usuarios WHERE email = ?`, [req.body.email], async (err, usuario) => {
            if(usuario[0] !== undefined){
                // Comprobando contraseñas
                const buscarPass = await bcrypt.compare(password, usuario[0].password);
                if(!buscarPass){
                    return res.status(400).json({message:'Contraseña incorrecta'});
                }else {
                    const token = await jwt.sign({ id: usuario[0].id }, process.env.SECRET_KEY, {
                        expiresIn: process.env.JWT_EXPIRE,
                    });
                    return res.cookie('token', token).json({success: true, message:'Ingresado correctamente', token: token})
                }
            } else{
                res.status(400).json({ message: 'El correo no exite' })
            }
        })
    } catch (error) {
        return res.json({ error: error });
    }

})
// ======= Fin ruta para hacer login a un usuario =======

// ======= Ruta para cerrar session =========
routes.put("/logout", isAuthenticated, (req, res) => {

    try {
        res.clearCookie("token");
        res.send({msg : 'Has sido desconectado' });
    } catch (error) {
        res.status(400).send({msg:'Error'});
    }
});
// ======= Fin ruta para cerrar session =========

module.exports = routes;
