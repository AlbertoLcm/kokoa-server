const express = require("express");
const routes = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const isAuthenticated = require("../middleware/autenticacion.js");

// ======= Ruta para hacer login a cualquier usuario =======
routes.post("/login", async (req, res) => {
  try {
    req.getConnection((err, conn) => {
      if (err)
        return res.status(400).json({ message: "algo salio mal en la query", error: err });

      const { email, password } = req.body;
      // Verificamos que ingresen datos
      if (!email || !password) {
        res.status(400).json({ message: "Debes ingresar todos los datos" });
        return;
      }
      // Verificamos si el usuario existe
      conn.query(
        `SELECT * FROM auth WHERE email = ? or telefono = ?`,
        [req.body.email, req.body.email],
        async (err, usuario) => {
          if (err)
            return res.json({
              message: "algo salio mal en la query",
              error: err,
            });

          if (usuario.length) {
            // Comprobando contraseñas
            const buscarPass = await bcrypt.compare(
              password,
              usuario[0].password
            );
            if (!buscarPass) {
              return res.status(400).json({ message: "Contraseña incorrecta" });
            } else {
              conn.query(
                "SELECT * FROM usuarios WHERE auth = ?",
                [usuario[0].id],
                async (err, user) => {
                  if (err)
                    return res.json({
                      message: "algo salio mal en la query",
                      error: err,
                    });

                  const token = await jwt.sign(
                    { id: user[0].id },
                    process.env.SECRET_KEY,
                    {
                      expiresIn: process.env.JWT_EXPIRE,
                    }
                  );
                  return res
                    .cookie("token", token)
                    .json({
                      success: true,
                      message: "Ingresado correctamente",
                      user: { token: token, nombre: user[0].nombre },
                    });
                }
              );
            }
          } else {
            res.status(400).json({ message: "El usuario no exite" });
          }
        }
      );
    });
  } catch (error) {
    return res.json({ error: error });
  }
});
// // ======= Fin ruta para hacer login a un usuario =======

// // ======= Ruta para cerrar session =========
routes.put("/logout", isAuthenticated, (req, res) => {
  const token = req.headers["authorization"];

  jwt.sign(token, "", { expiresIn: 1 }, (logout, err) => {
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
      if (err) return res.send(err);

      res.json(result);
    });
  });
});

routes.post("/", isAuthenticated, async (req, res) => {
  const token = req.headers["authorization"];
  const verify = await jwt.verify(token, process.env.SECRET_KEY);
  req.getConnection((errBD, conn) => {
    if(errBD) return res.status(400).json({message: "algo salio mal", error: errBD})
    conn.query(
      "SELECT * FROM usuarios WHERE id = ?",
      [verify.id],
      (err, user) => {
        if (!user.length) {
          res.status(400).json({ message: "no hay usuario" });
        } else {
          return res
            .status(200)
            .json({
              message: "Encontrado",
              user: { token: token, nombre: user[0].nombre },
            });
        }
      }
    );
  });
});

module.exports = routes;
