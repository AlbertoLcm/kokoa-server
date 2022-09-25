const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const PassportLocal = require('passport-local').Strategy;

const app = express();

app.use(cookieParser('secreto12'));
// app.set('trust proxy', 1);
app.use(session({
    // cookie:{
    //     secure: true
    //        },
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    app.locals.user = req.user;
    next();
  });


passport.use(new PassportLocal((username, password, done) => {
    conexion.query('SELECT * FROM usuarios WHERE correo = ? AND password = ?',[username, password], (error, usuario) => {
        try {
            if(username === usuario[0].correo && password === usuario[0].password){
                console.log("Sesion Iniciada", {id:usuario[0].matricula, name:usuario[0].nombre});
                return done(null, {id:usuario[0].matricula, name:usuario[0].nombre, foto:usuario[0].foto});
            }
        } catch (error) {
            console.log('Usuario o contraseña inconrrecto');
            done(null, false);
        }
    });
    
}));

passport.serializeUser((usuario, done) => {
    done(null, usuario.id);
})

//deserializacion 
passport.deserializeUser((id, done) => {
    conexion.query('SELECT * FROM usuarios WHERE matricula = ?', [id], (error, usuario) => {
        if(error) throw error;
        done(null, {id:usuario[0].matricula, name:usuario[0].nombre, foto:usuario[0].foto});
    });
})

app.get('/', (req, res, next)=>{
    if(!req.isAuthenticated()) return next();

    res.redirect('/principal');
}, (req, res) => {
    res.render('login');
}); 


app.post('/', passport.authenticate('local',{
    successRedirect: '/principal',
    failureRedirect: '/',
    passReqToCallback: true
}));