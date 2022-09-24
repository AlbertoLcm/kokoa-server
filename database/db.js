const mysql = require('mysql2');

const conexion = mysql.createPool({
    host: 'us-cdbr-east-06.cleardb.net',
    database: 'heroku_75d7d8951a75510',
    user: 'b45a2eec4d6249',
    password: 'f1419041',
    port: '3306',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

conexion.getConnection((error) => {
    if(error){
        console.log({ message: 'Error en la conexión con la BD', error, action: 'Reiniciar el Servidor'});
        return;
    } 
    console.log({ message: 'Conexion correcta con la BD'})
})

module.exports = conexion; 