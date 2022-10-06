const express = require("express");
const routes = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ======= Ruta para registrar un usuario =======
routes.post("/signup", async (req, res) => {
    try {
        const {
            nombre,
            apellidos,
            email,
            telefono,
            password
        } = req.body;
        // Verificamos que ingresen todos los datos
        if (!nombre || !apellidos || !email || !telefono || !password) {
            return res.status(400).json({message: "Debes ingresar todos los datos"});
        }
        // Hasheamos la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.password, salt);
        req.body.password = hashPassword;
        // Inciamos conexion con la BD
        req.getConnection((errBD, conn) => {
            if (errBD) 
                return res.json({message: "Algo salio mal con la Query", error: errBD});
            


            // Verificamos si existe el usuarios en la BD
            conn.query("SELECT * FROM auth WHERE email = ?", [req.body.email], (err, emailRes) => {
                if (err) 
                    return res.status(400).json({message: "Algo salio mal en la query", error: err.sqlMessage});
                


                // Verificamos si el telefono existe en la BD
                if (!emailRes.length) {
                    conn.query("SELECT * FROM auth WHERE telefono = ?", [req.body.telefono], (err, telefonoRes) => {
                        if (err) 
                            return res.status(400).json({message: "Algo salio mal en la query", error: err.sqlMessage});
                        


                        // Insertamos todo en la tabla auth
                        if (!telefonoRes.length) {
                            conn.query("INSERT INTO auth SET ?", [
                                {
                                    email: req.body.email,
                                    telefono: req.body.telefono,
                                    password: req.body.password
                                },
                            ], (err) => {
                                if (err) 
                                    return res.json({msg: err});
                                


                                // Buscamos la data del usuario ingresado
                                conn.query("SELECT * FROM auth WHERE email = ?", [req.body.email], (err, auth) => {
                                    if (err) 
                                        return res.status(400).json({meesage: "Algo salio mal con la query", err: err.sqlMessage});
                                    


                                    // Ingresamos la data en la tabla usuarios
                                    conn.query("INSERT INTO usuarios SET ?", [
                                        {
                                            nombre: req.body.nombre,
                                            apellidos: req.body.apellidos,
                                            auth: auth[0].id
                                        },
                                    ], (err) => {
                                        if (err) 
                                            return res(400).json({message: "algo salio mal en la query", error: err.sqlMessage});
                                        


                                        conn.query("SELECT * FROM usuarios JOIN auth ON usuarios.auth = auth.id WHERE auth.id = ?", [auth[0].id], async (err, user) => {
                                            const token = await jwt.sign({
                                                id: user[0].id
                                            }, process.env.SECRET_KEY, {expiresIn: process.env.JWT_EXPIRE});
                                            return res.cookie("token", token).json({
                                                success: true,
                                                message: "Usuario registrado",
                                                user: {
                                                    token: token,
                                                    data: user
                                                }
                                            });
                                        });
                                    });
                                });
                            });
                        } else {
                            res.status(400).json({message: "El telefono ya existe"});
                        }
                    });
                } else {
                    res.status(400).json({message: "El correo ya existe"});
                }
            });
        });
    } catch (error) {
        return res.json({error: error});
    }
});
// ======= Fin de la ruta de registrar ======

routes.get("/", (req, res) => {
    req.getConnection((errBD, conn) => {
        if (errBD) 
            return res.status(400).json({message: "Algo salio mal con la Query", error: errBD});
        


        conn.query("SELECT * FROM usuarios, auth WHERE usuarios.auth = auth.id;", (err, usuarios) => {
            if (err) 
                return res.send(err);
            


            res.json(usuarios);
        });
    });
});

routes.delete("/:id", (req, res) => {
    req.getConnection((errBD, conn) => {
        if (errBD) 
            return req.status(400).json({message: "Algo salio mal con la Query", error: err});
        


        conn.query("DELETE FROM usuarios WHERE id = ?", [req.params.id], (err, result) => {
            if (err) 
                return res.send(err);
            


            res.status(200).json({meesage: "Usuario borrado"});
        });
    });
});

routes.put("/:id", (req, res) => {
    req.getConnection((errBD, conn) => {
        if (errBD) 
            return req.status(400).json({message: "Algo salio mal con la Query", error: err});
        


        conn.query("UPDATE usuarios set ? WHERE id = ?", [
            req.body, req.params.id
        ], (err, result) => {
            if (err) 
                return res.send(err);
            


            res.json({status: "200 OK", descripcion: "Usuario actualizado"});
        });
    });
});

module.exports = routes;
