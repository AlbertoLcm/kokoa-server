const dotenv = require('dotenv');
const Server = require('./models/server');

// Configure dotenv files above using any other library and files
dotenv.config({path:'./config.env'}); 

const server = new Server();

server.listen();