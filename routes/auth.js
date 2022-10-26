const express = require("express");
const routes = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const promisePool = require('../database/dbPromise.js');
const isAuthenticated = require("../middleware/autenticacion.js");

// ======= Ruta para hacer login a un usuario =======
routes.post("/login", async (req, res) => {
  try {

    const { email, password } = req.body;
    // Paso 1 - Verificamos que ingresen datos
    if (!email || !password) {
      return res.status(400).json({ message: "Debes ingresar todos los datos" });
    }
    // Paso 2 - Verificamos si el usuario existe
    const [usuario] = await promisePool.query("SELECT * FROM auth WHERE email = ? or telefono = ?", [email, email]);
    if (!usuario.length) {
      return res.status(400).json({ message: "El usuario no exite" });
    }
    // Paso 3 - Comprobamos contraseñas
    const buscarPass = await bcrypt.compare(password, usuario[0].password);
    if (!buscarPass) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }
    const [user] = await promisePool.query("SELECT * FROM auth WHERE id = ?", [usuario[0].id]);
    // Paso 4 - Obtenemos toda la informacion del usuario
    const [userDB] = await promisePool.query(`SELECT * FROM ${user[0].rol} JOIN auth ON ${user[0].rol}.auth = auth.id WHERE auth.id = ?`, [user[0].id]);
    // Paso 5 - Creamos el token
    const token = await jwt.sign({
      id: userDB[0].id
    }, process.env.SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE });

    return res.cookie("token", token).json({
      success: true,
      message: "Ingresado correctamente",
      user: {
        token: token,
        data: userDB[0]
      }
    });

  } catch (error) {
    return res.status(400).json({ error: error });
  };
});
// ======= Fin ruta para hacer login a un usuario =======

// ======= Ruta para hacer login a un cargo del usuario =======
routes.post("/login/cargo", async (req, res) => {
  try {
    // Paso 1 - Obtenemos toda la informacion del usuario
    const [userGeneral] = await promisePool.query("SELECT * FROM usuarios JOIN auth on usuarios.auth = auth.id WHERE usuarios.id = ?", [req.body.id_usuario]);
    // Paso 2 - Obtenemos toda la informacion del cargo
    const [userCargo] = await promisePool.query(`SELECT * FROM ${req.body.rol} WHERE id = ?`, [req.body.id]);
    // Paso 3 - Creamos el token
    const token = await jwt.sign({
      id: userGeneral[0].id
    }, process.env.SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE });

    return res.cookie("token", token).json({
      success: true,
      message: "Ingresado correctamente",
      user: {
        token: token,
        data: {
          nombre: userGeneral[0].nombre,
          apellidos: userGeneral[0].apellido,
          domicilio: userGeneral[0].domicilio,
          email: userGeneral[0].email,
          telefono: userGeneral[0].telefono,
          id: userGeneral[0].id,
          auth: userGeneral[0].auth,
          id_cargo: userCargo[0].id,
          rol: userCargo[0].rol,
          nombre_cargo: userCargo[0].nombre,
          direccion_cargo: userCargo[0].direccion,
          horario_cargo: userCargo[0].horario,
        }
      }
    });

  } catch (error) {
    return res.status(400).json({ message: "Algo salio mal", error: error });
  };
});
// ======= FIN Ruta para hacer login a un cargo del usuario =======

// // ======= Ruta para cerrar session =========
routes.put("/logout", isAuthenticated, (req, res) => {
  const token = req.headers["authorization"];
  jwt.sign(token, "", {
    expiresIn: 1
  }, (logout, err) => {
    if (logout) {
      res.clearCookie("token");
      res.status(200).send({ msg: "Has sido desconectado" });
    } else {
      res.status(400).send({ msg: "Error" });
    }
  });
});
// // ======= Fin ruta para cerrar session =========

routes.get("/", (req, res) => {
  req.getConnection((err, conn) => {
    conn.query("SELECT * FROM auth", (err, result) => {
      if (err)
        return res.send(err);

      res.json(result);
    });
  });
});

routes.get("/:id", (req, res) => {
  req.getConnection((err, conn) => {
    conn.query("SELECT * FROM auth WHERE id = ?", [req.params.id], (err, userAuth) => {
      if (err)
        return res.status(400).json({ message: "algo salio mal en la query", error: err });

      conn.query(`SELECT * FROM ${userAuth[0].rol} WHERE auth = ?`, [userAuth[0].id], (err, user) => {
        if (err)
          return res.status(400).json({ message: "algo salio mal en la query", error: err });

        res.json({ user: user[0], auth: userAuth[0] });
      });
    });
  });
})

routes.post("/", isAuthenticated, async (req, res) => {
  const token = req.headers["authorization"];
  const verify = await jwt.verify(token, process.env.SECRET_KEY);
  req.getConnection((errBD, conn) => {
    if (errBD)
      return res.status(400).json({ message: "algo salio mal", error: errBD })

    conn.query("SELECT * FROM auth WHERE id = ?", [verify.id], (err, user) => {
      if (err)
        return res.status(400).json({ message: "algo salio mal", error: err });

      if (!user.length) {
        res.status(400).json({ message: "no hay usuario" });
      } else {
        conn.query(`SELECT * FROM usuarios JOIN auth ON usuarios.auth = auth.id WHERE auth.id = ?`, [user[0].id], (err, usuarioDB) => {
          if (err)
            return res.status(400).json({ message: "algo salio mal", error: err });

          return res.status(200).json({
            message: "Encontrado",
            user: {
              token: token,
              data: usuarioDB[0]
            }
          });
        });
      };
    });
  });
});

module.exports = routes;
