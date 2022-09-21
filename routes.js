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

module.exports = routes;