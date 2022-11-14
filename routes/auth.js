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
    const [user] = await promisePool.query("SELECT * FROM usuarios WHERE email = ? or telefono = ?", [email.trim(), email.trim()]);
    if (!user.length) {
      return res.status(400).json({ message: "El usuario no exite" });
    }
    // Paso 3 - Comprobamos contraseñas
    const buscarPass = await bcrypt.compare(password, user[0].password);
    if (!buscarPass) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }
    // Paso 4 - Creamos el token
    const token = await jwt.sign({
      id: user[0].id
    }, process.env.SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE });

    return res.cookie("token", token).json({
      success: true,
      message: "Ingresado correctamente",
      user: {
        token: token,
        data: user[0]
      }
    });

  } catch (error) {
    return res.status(400).json({ error: error });
  };
});
// ======= Fin ruta para hacer login a un usuario =======

// ======= Ruta para hacer login en reset password =======
routes.post("/resetpassword", async (req, res) => {
  try {
    const { id } = req.body;
    // Paso 1 - Verificamos que ingresen datos
    if (!id) {
      return res.status(400).json({ message: "Debes ingresar todos los datos" });
    }
    // Paso 2 - Verificamos si el usuario existe
    const [user] = await promisePool.query("SELECT * FROM usuarios WHERE id", [id]);
    if (!user.length) {
      return res.status(400).json({ message: "El usuario no exite" });
    }
    // Paso 3 - Creamos el token
    const token = await jwt.sign({
      id: user[0].id
    }, process.env.SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE });

    return res.cookie("token", token).json({
      success: true,
      message: "Ingresado correctamente",
      user: {
        token: token,
        data: user[0]
      }
    });

  } catch (error) {
    return res.status(400).json({ error: error });
  };
});
// ======= FIN Ruta para hacer login en reset password =======

// ======= Ruta para hacer login a un cargo del usuario =======
routes.post("/login/cargo", async (req, res) => {
  try {
    // Paso 1 - Obtenemos toda la informacion del usuario
    const [userGeneral] = await promisePool.query("SELECT * FROM usuarios WHERE id = ?", [req.body.propietario]);
    // Paso 2 - Obtenemos toda la informacion del cargo
    const [userCargo] = await promisePool.query(`SELECT * FROM ${req.body.rol} WHERE id = ?`, [req.body.id]);
    // Paso 3 - Creamos el token
    const token = await jwt.sign({
      id: userGeneral[0].id,
      id_cargo: userCargo[0].id,
      rol: req.body.rol
    }, process.env.SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE });

    return res.cookie("token", token).json({
      success: true,
      message: "Ingresado correctamente",
      user: {
        token: token,
        // Aqui manipule la informacion que se envia al front convinandola con el cargo del que inicio sesión
        data: {
          nombre: userGeneral[0].nombre,
          apellidos: userGeneral[0].apellido,
          domicilio: userGeneral[0].domicilio,
          email: userGeneral[0].email,
          telefono: userGeneral[0].telefono,
          id_user: userGeneral[0].id,
          auth: userGeneral[0].auth,
          id: userCargo[0].id,
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

// Ruta para volver a la cuenta principal desde un cargo
routes.post("/login/back", async (req, res) => {

  const { id } = req.body;
  // Paso 1 - Verificamos que ingresen datos
  if (!id) {
    return res.status(400).json({ message: "Debes ingresar todos los datos" });
  }
  try {
    // Paso 2 - Buscamos el usuario
    const [user] = await promisePool.query("SELECT * FROM usuarios WHERE id = ?", [id]);

    const token = await jwt.sign({
      id: user[0].id
    }, process.env.SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE });

    return res.cookie("token", token).json({
      success: true,
      message: "Ingresado correctamente",
      user: {
        token: token,
        data: user[0]
      }
    });
  } catch (error) {
    res.status(400).json({ message: "Algo salio mal", error: error });
  }
});


// ======= Ruta para cerrar session =========
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

routes.get("/:id", async(req, res) => {
  try {
    const [userUsuario] = await promisePool.query("SELECT * FROM usuarios WHERE id = ?", [req.params.id]);
    if(userUsuario.length) {
      return res.status(200).json(userUsuario[0]);
    }
    const [userNegocio] = await promisePool.query("SELECT * FROM negocios WHERE id = ?", [req.params.id]);
    return res.status(200).json(userNegocio[0]);
  } catch (error) {
    return res.status(400).json({ message: "algo salio mal en la query", error: error });
  }
})

routes.post("/", isAuthenticated, async (req, res) => {
  const token = req.headers["authorization"];
  const verify = await jwt.verify(token, process.env.SECRET_KEY);

  try {
    if(verify.role) {
      const [userCargo] = await promisePool.query(`SELECT * FROM ${verify.rol} WHERE id = ?`, [verify.id]);
      const [userGeneral] = await promisePool.query("SELECT * FROM usuarios WHERE id = ?", [userCargo[0].propietario]);

      return res.status(200).json({
        message: "Encontrado",
        user: {
          token: token,
          // Aqui manipule la informacion que se envia al front convinandola con el cargo del que inicio sesión
          data: {
            nombre: userGeneral[0].nombre,
            apellidos: userGeneral[0].apellido,
            domicilio: userGeneral[0].domicilio,
            email: userGeneral[0].email,
            telefono: userGeneral[0].telefono,
            id_user: userGeneral[0].id,
            auth: userGeneral[0].auth,
            id: userCargo[0].id,
            rol: userCargo[0].rol,
            nombre_cargo: userCargo[0].nombre,
            direccion_cargo: userCargo[0].direccion,
            horario_cargo: userCargo[0].horario,
          }
        }
      });
    }
    const [user] = await promisePool.query("SELECT * FROM usuarios WHERE id = ?", [verify.id]);
    if (!user.length) {
      return res.status(400).json({ message: "El usuario no exite" });
    }
    return res.status(200).json({
      message: "Encontrado",
      user: {
        token: token,
        data: user[0]
      }
    });
  } catch (error) {
    return res.status(400).json({ message: "Algo salio mal", error: error });
  }
});

module.exports = routes;
