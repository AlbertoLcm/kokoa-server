const express = require('express');
const routes = express.Router();
const multer = require('multer');
const fs = require("fs");
const fsPromise = require('fs').promises
const promisePool = require('../database/dbPromise');

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './images');
  },
  filename: async (req, file, callback) => {
    const ext = file.originalname.split('.').pop();
    const nomImg = `${Date.now()}.${ext}`;
    const nombreCompleto = `https://koko-server.fly.dev/api/upload/${nomImg}`;
    await promisePool.query(`UPDATE ${req.body.rol} SET ? WHERE id = ?`, [{ perfil: nombreCompleto }, req.body.id]);
    
    // Eliminamos la imagen anterior
    const nombre = req.body.anterior.split('/').pop();
    if(nombre !== 'user.jpg'){
      fsPromise.unlink(`./images/${nombre}`)
      .then(() => {
      }).catch(err => {
        console.log(err)
      })
    }
    
    callback(null, nomImg);
  }
});

const upload = multer({ storage });

routes.post('/profile', upload.single('avatar'), (req, res, next) => {
  res.status(200).json({message: 'Imagen subida correctamente' });
})

routes.get('/', (req, res) => {
  let filenames = fs.readdirSync('./images');
  let files = [];
  let img = {};
  filenames.forEach((file, index) => {
    img = {
      imagen: index+1,
      nombre: file
    };
    files.push(img);
  });
  res.status(200).json(files);
});

routes.get('/:imagen', (req, res) => {

  // respondemos con la imagen
  const path = `./images/${req.params.imagen}`;

  const imagen = fs.readFileSync(path);
  
  // enviamos la imagen
  res.writeHead(200, {'Content-Type': 'image/png' });
  res.end(imagen, 'binary');
  
});

module.exports = routes;