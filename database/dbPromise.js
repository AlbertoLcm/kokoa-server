const mysql = require('mysql2');

// Creamos la conexión pool
const pool = mysql.createPool(process.env.DATABASE_URL);

// Instanciamos la conexión para obtener una promesa
const promisePool = pool.promise();

// exportamos wrapped pool
module.exports = promisePool;