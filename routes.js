const { response } = require('express');
const express = require('express');
const routes = express.Router();

routes.get('/', (req, res) => {
    req.getConnection((err, conn) => {
        if(err) return res.send(err)

        conn.query('SELECT * FROM usuarios', (err, result) => {
            if(err) return res.send(err)

            res.json(result);
        });
    })
});

routes.post('/', (req, res) => {
    req.getConnection((err, conn) => {
        if(err) return res.send(err)
        
        conn.query('INSERT INTO usuarios set ?', [req.body], (err, result) => {
            if(err) return res.send(err)


            console.log('metodo post agregar')
            res.json({
                status: '200 OK',
                descripcion: 'Usuario agregado'
            });
        });
    })
});

routes.delete('/:id', (req, res) => {
    req.getConnection((err, conn) => {
        if(err) return res.send(err)
        
        conn.query('DELETE FROM usuarios WHERE id = ?', [req.params.id], (err, result) => {
            if(err) return res.send(err)

            res.json({
                status: '200 OK',
                descripcion: 'Usuario eliminado'
            });
        });
    })
});

routes.put('/:id', (req, res) => {
    req.getConnection((err, conn) => {
        if(err) return res.send(err)
        
        conn.query('UPDATE usuarios set ? WHERE id = ?', [req.body, req.params.id], (err, result) => {
            if(err) return res.send(err)

            res.json({
                status: '200 OK',
                descripcion: 'Usuario actualizado'
            });
        });
    })
});

routes.post('/login', (req, res) => {
    req.getConnection((err, conn) => {
        if(err) return res.send(err)
        
        conn.query('select * from usuarios where email = ? and password = ?', [req.body.email, req.body.password], (err, result) => {
            if(err) return res.send(err)

            if(result[0]==null){
                console.log('no econtrado')
                res.json(result);
            }else{
                console.log('encontrado')
                res.json(result);
            }
        });
    })
});

module.exports = routes;