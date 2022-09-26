const express = require('express');
const routes = express.Router();
const conexion = require('../database/db.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
            conexion.query('SELECT * FROM auth WHERE email = ?', [req.body.email], (err, results) => {
                if(err) return res.json({ message: 'Algo salio mal en la query', error:err.sqlMessage });

                if(results[0] == null){
                    conexion.query('SELECT * FROM auth WHERE telefono = ?', [req.body.telefono], (err, results) => {
                        if(err) return res.json({ message: 'Algo salio mal en la query', error:err.sqlMessage });

                        if(results[0] == null){
                            conexion.query('INSERT INTO auth SET ?', [{
                                "email": req.body.email, 
                                "telefono": req.body.telefono,
                                "password": req.body.password
                            }],(err, result) =>{
                                if(err) return res.json({msg: err});

                                conexion.query('SELECT * FROM auth WHERE email = ?', [req.body.email], (err, auth) => {
                                    if(err) return res.json({ meesage: 'Algo salio mal con la query', err: err.sqlMessage })
                                        conexion.query('INSERT INTO patrocinadores SET ?', [{
                                            "nombre": req.body.nombre,
                                            "ubicacion": req.body.direccion,
                                            "descripcion": req.body.descripcion,
                                            "auth": auth[0].id
                                        }], (err, result) => {
                                            if(err) return res.json({ message: 'algo salio mal en la query', error:err.sqlMessage });
                                            
                                            conexion.query('SELECT * FROM patrocinadores WHERE auth = ?', [auth[0].id], async (err, usuario) => {
                                                const token = await jwt.sign({ id: usuario[0].id }, process.env.SECRET_KEY, {
                                                    expiresIn: process.env.JWT_EXPIRE,
                                                });
                                                return res.cookie('token', token ).json({ success: true, message: 'Patrocinador registrado', token: token, nombre:usuario[0].nombre })
                                            })
                                        })
                                });
                            });
                        }else{
                            res.status(400).json({ message: 'El telefono ya existe'});
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
    conexion.query('SELECT * FROM patrocinadores, auth WHERE patrocinadores.auth = auth.id', (err, result) => {
        if(err) return res.send(err)

        res.json(result);
    });
});

routes.delete('/:id', (req, res) => {
    conexion.query('DELETE FROM patrocinadores WHERE id = ?', [req.params.id], (err, result) => {
        if(err) return res.send(err)
        res.status(200).json({ meesage: 'Patrocinador borrado' });
    });
});

routes.put('/:id', (req, res) => {
    conexion.query('UPDATE patrocinadores set ? WHERE id = ?', [req.body, req.params.id], (err, result) => {
        if(err) return res.send(err)

        res.json({
            status: '200 OK',
            descripcion: 'Patrocinador actualizado'
        });
    });
});

module.exports = routes;