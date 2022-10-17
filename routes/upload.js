const express = require('express');
const routes = express.Router();
const multer = require('multer');
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './images');
  },
  filename: (req, file, callback) => {
    const ext = file.originalname.split('.').pop();
    const nomImg = `${Date.now()}.${ext}`;

    callback(null, nomImg);
  }
});

const upload = multer({ storage });
routes.post('/profile', upload.single('avatar'), (req, res, next) => {
  res.status(200).json({message: 'Imagen subida correctamente'});
})

routes.get('/', (req, res) => {
  let filenames = fs.readdirSync('../images');
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

module.exports = routes;