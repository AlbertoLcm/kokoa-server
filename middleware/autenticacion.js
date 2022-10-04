const jwt = require('jsonwebtoken');
const { request, response } = require('express');
const isAuthenticated = async (req = request,res = response,next)=>{
    try {
        const token = req.headers["authorization"];
        // const { token } = req.cookies;
        console.log(token)
        if(!token){
            return res.status(400).json({ message: 'No hay un token' });
        }
        const verify = await jwt.verify(token, process.env.SECRET_KEY);
        req.getConnection((err, conn) => {
            if(err) return res.status(400).json({message: 'Algo salio mal en la query', error: err});
            conn.query('SELECT * FROM usuarios WHERE id = ?', [verify.id], (errQ, usuario) => {
                if(errQ) return res.status(400).json({message: 'Algo salio mal en la query', error: err});
                
                if(!usuario.length){
                    next(err);
                }else{
                    next();
                }
            });
        });
    } catch (error) {
        res.status(400).json({message: 'Acceso denegado'})
       return next(error); 
    }
}

module.exports = isAuthenticated;