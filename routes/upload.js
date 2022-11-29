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
    if(req.body.portada){
      await promisePool.query(`UPDATE ${req.body.rol} SET ? WHERE id = ?`, [{ portada: nombreCompleto }, req.body.id]);
    }else{
      await promisePool.query(`UPDATE ${req.body.rol} SET ? WHERE id = ?`, [{ perfil: nombreCompleto }, req.body.id]);
    }
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

routes.get('/:imagen', async (req, res) => {

  // respondemos con la imagen
  let path = `./images/${req.params.imagen}`;
  try {
    let imagen = fs.readFileSync(path);
    // enviamos la imagen
    res.writeHead(200, {'Content-Type': 'image/png' });
    res.end(imagen, 'binary');
  } catch (error) {

    // buscamos la imagen ingresada en la base de datos
    const [usuarios] = await promisePool.query(`SELECT perfil FROM usuarios WHERE perfil = '%${req.params.imagen}%'`)
    const [negocios] = await promisePool.query(`SELECT perfil FROM negocios WHERE perfil OR portada = '%${req.params.imagen}%'`)
    const [patrocinadores] = await promisePool.query(`SELECT perfil FROM patrocinadores WHERE perfil OR portada = '%${req.params.imagen}%'`)
    const [artistas] = await promisePool.query(`SELECT perfil FROM artistas WHERE perfil OR portada = '%${req.params.imagen}%'`)

    if(usuarios.length){
      await promisePool.query(`UPDATE usuarios SET ? WHERE perfil = '%${req.params.imagen}%'`, [{ perfil: 'https://koko-server.fly.dev/api/upload/user.jpg' }])
    }
    if(negocios.length){
      await promisePool.query(`UPDATE negocios SET ? WHERE perfil = '%${req.params.imagen}%'`, [{ 
        perfil: 'https://koko-server.fly.dev/api/upload/user.jpg', 
        portada: 'https://koko-server.fly.dev/api/upload/user.jpg' 
      }])
    }
    if(patrocinadores.length){
      await promisePool.query(`UPDATE patrocinadores SET ? WHERE perfil = '%${req.params.imagen}%'`, [{ perfil: 'https://koko-server.fly.dev/api/upload/user.jpg', portada: 'https://koko-server.fly.dev/api/upload/user.jpg' }])
    }
    if(artistas.length){
      await promisePool.query(`UPDATE artistas SET ? WHERE perfil = '%${req.params.imagen}%'`, [{ perfil: 'https://koko-server.fly.dev/api/upload/user.jpg', portada: 'https://koko-server.fly.dev/api/upload/user.jpg' }])
    }
    
    const path = `./images/user.jpg`;
    const imagen = fs.readFileSync(path);
    // enviamos la imagen
    res.writeHead(200, {'Content-Type': 'image/png' });
    res.end(imagen, 'binary');
  }
  
  
});

module.exports = routes;