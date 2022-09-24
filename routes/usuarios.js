const express = require('express');
const routes = express.Router();
const conexion = require('../database/db.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ======= Ruta para registrar un usuario =======
    routes.post("/signup", async (req, res) => {
        try {
            const { nombre, apellidos, email, telefono, password } = req.body;
            // Verificamos que ingresen todos los datos
            if (!nombre || !apellidos || !email || !telefono || !password) {
                return res.status(400).json({ message: 'Debes ingresar todos los datos' })
            }
            // Hasheamos la contraseña
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(req.body.password, salt);
            req.body.password = hashPassword;
            // Verificamos si existe el usuarios en la BD
            conexion.query('SELECT * FROM usuarios WHERE email = ?', [req.body.email], (err, results) => {
                if(err) return res.json({ message: 'Algo salio mal en la query', error:err.sqlMessage });

                if(results[0] == null){
                    conexion.query('SELECT * FROM usuarios WHERE telefono = ?', [req.body.telefono], (err, results) => {
                        if(err) return res.json({ message: 'Algo salio mal en la query', error:err.sqlMessage });

                        if(results[0] == null){
                            conexion.query('INSERT INTO usuarios SET ?', [req.body], (err, result) => {
                                if(err) return res.json({ message: 'algo salio mal en la query', error:err.sqlMessage });
                                
                        
                                conexion.query('SELECT * FROM usuarios WHERE email = ?', [req.body.email], async (err, usuario) => {
                                    const token = await jwt.sign({ id: usuario[0].id }, process.env.SECRET_KEY, {
                                        expiresIn: process.env.JWT_EXPIRE,
                                    });
                                    return res.cookie('token', token ).json({ success: true, message: 'Usuario registrado', data: results[0], token: token })
                                })

                            })
                        }else{
                            res.status(400).json({ message: 'El telefono ya existe '});
                        }
                    })
                }else{
                    res.status(400).json({ message: 'El correo ya existe' })
                }
            })
        } catch (error) {
            return res.json({ error: error });
        }

    })
// ======= Fin de la ruta de registrar ======

routes.get('/', (req, res) => {
    conexion.query('SELECT * FROM usuarios', (err, result) => {
        if(err) return res.send(err)

        res.json(result);
    });
});

routes.delete('/:id', (req, res) => {
    conexion.query('DELETE FROM usuarios WHERE id = ?', [req.params.id], (err, result) => {
        if(err) return res.send(err)
        res.status(200).json({ meesage: 'Usuario borrado' });
    });
});

routes.put('/:id', (req, res) => {
    conexion.query('UPDATE usuarios set ? WHERE id = ?', [req.body, req.params.id], (err, result) => {
        if(err) return res.send(err)

        res.json({
            status: '200 OK',
            descripcion: 'Usuario actualizado'
        });
    });
});

module.exports = routes;