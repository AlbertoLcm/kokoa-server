// Sockets
const io = socketio.listen(server)

io.on('connection', socket => {
    console.log('usuario conectado');

    socket.on('send-message', mensaje => {

        conexion.query('INSERT INTO mensajes SET ?', {
            mensaje: mensaje.mensaje,
            receptor: false,
            matricula_receptor: mensaje.emisor,
            matricula_emisor: mensaje.receptor
        }, (error, results) => {
            if(error){
                console.log(error);
                return;
            }
            console.log('mensaje guardado')
        });

        io.sockets.emit(`new-message-${mensaje.receptor}-${mensaje.emisor}`, mensaje.mensaje);
        
        console.log({mensaje})
        
        conexion.query('INSERT INTO mensajes SET ?', {
            mensaje: mensaje.mensaje,
            receptor: true,
            matricula_receptor: mensaje.receptor,
            matricula_emisor: mensaje.emisor}, (error, results) => {
            console.log('mensaje guardado')
        });
        
    });
});