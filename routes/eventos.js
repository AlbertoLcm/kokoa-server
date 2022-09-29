const express = require("express");
const routes = express.Router();
const conexion = require("../database/db.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ======= Ruta para registrar un evento =======
routes.post("/add", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    // Verificamos que ingresen todos los datos
    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Debes ingresar todos los datos" });
    }
    conexion.query('SELECT * FROM eventos where lat = ? and lng = ?', [req.body.lat, req.body.lng], (err, eventos)=>{
        if(err) return res.status(400).json({message: 'algo salio mal con la query', error: err});

        if(eventos[0] == null){
            conexion.query("INSERT INTO eventos SET ?", [req.body], (err, result) => {
              if (err) return res.json({ msg: err });
        
              return res.status(200).json({ message: "Evento registrado" });
            });
        }else{
            return res.status(400).json({message: 'Ya hay un evento en ese lugar :c'})
        }

    })
  } catch (error) {
    return res.json({ error: error });
  }
});
// ======= Fin de la ruta de registrar ======

routes.get("/", (req, res) => {
  conexion.query(
    "SELECT * FROM eventos",
    (err, result) => {
      if (err) return res.send(err);

      res.json(result);
    }
  );
});

routes.delete("/:id", (req, res) => {
  conexion.query(
    "DELETE FROM usuarios WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.send(err);
      res.status(200).json({ meesage: "Usuario borrado" });
    }
  );
});

routes.put("/:id", (req, res) => {
  conexion.query(
    "UPDATE usuarios set ? WHERE id = ?",
    [req.body, req.params.id],
    (err, result) => {
      if (err) return res.send(err);

      res.json({
        status: "200 OK",
        descripcion: "Usuario actualizado",
      });
    }
  );
});

module.exports = routes;
