const express = require("express");
const routes = express.Router();
const conexion = require("../database/db.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ======= Ruta para registrar un evento =======
routes.post("/add", async (req, res) => {
  let fechaInicio = req.body.datosEvento.fechaInicio;
  let horaIncio= req.body.datosEvento.horaIncio;
  let fechaTermino = req.body.datosEvento.fechaTermino;
  let horaTermino= req.body.datosEvento.horaTermino;

  const fecha_inicio = `${fechaInicio} ${horaIncio}:00`;
  const fecha_termino = `${fechaTermino} ${horaTermino}:00`;

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
            conexion.query("INSERT INTO eventos SET ?", [{
              "nombre": req.body.datosEvento.nombre,
              "fecha_inicio": fecha_inicio,
              "fecha_termino": fecha_termino,
              "lat": req.body.lat,
              "lng": req.body.lng
            }], (err, result) => {
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
