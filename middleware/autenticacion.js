const jwt = require('jsonwebtoken');
const conexion = require('../database/db');
const isAuthenticated = async (req,res,next)=>{
    try {
        // const token = req.headers["authorization"];
        const { token } = req.cookies;
        if(!token){
            return res.status(400).json({ message: 'No hay un token' });
        }
        const verify = await jwt.verify(token, process.env.SECRET_KEY);
        req.user = conexion.query('SELECT * FROM usuarios WHERE id = ?', [verify.id], (err, usuario) => {
            if(usuario[0] == undefined){
                next(err);
            }else{
                next();
            }
        });
    } catch (error) {
        res.status(400).json({message: 'Acceso denegado'})
       return next(error); 
    }
}

module.exports = isAuthenticated;