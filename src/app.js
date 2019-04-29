const express = require('express'),
  path = require('path'),
  morgan = require('morgan'),
  mysql = require('mysql'),
  myConnection = require('express-myconnection'),
  session = require('express-session'),
  cookieParser = require('cookie-parser'),
  $ = require('jquery'),
  moment = require('moment')
  swaggerUi = require('swagger-ui-express'),
  btoa = require('btoa');
  // swaggerDocument = require('./swagger.json');

const accountRoutes = require('./routes/account');

const app = express();
  // settings
  app.set('port', process.env.PORT || 3000);
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  // app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  // app.use('/api/v1', router);

  // middlewares
  app.use(morgan('dev'));
  app.use(myConnection(mysql, {
    host: 'localhost',
    user: 'root',
    password: 'root',
    port: 3306,
    database: 'brilworks'
  }, 'single'));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  // Track session
  app.use(session({
    key: 'user_sid',
    secret: 'EMCFsQ6uCIGpZM5XZnnk',
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 600000
    }
  }));
  app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
      res.clearCookie('user_sid');
    }
    next();
  });

  // routes
  app.use('/', accountRoutes);

var sessionChecker = (req, res, next) => {

  if (req.session.user && req.cookies.user_sid) {
    res.redirect('/l/dashboard');
  } else {
    next();
  }
};


app.get('/', sessionChecker, (req, res) => {
  res.redirect('/login');
});

app.route('/login')
  .get(sessionChecker, (req, res) => {
    res.render('login');
  })

  .post((req, res) => {
   var username = req.body.Username,
      password = req.body.password;

    req.getConnection((err, conn) => {
     conn.query('SELECT * FROM users where username = ? AND password = md5(?) ', [username, password], (err, users) => {
       
        if (users.length <=0 ) {
          res.redirect('/login');
        } else {
          let options = {
            maxAge: 1000 * 60 * 15, // would expire after 15 minutes
            httpOnly: false, // The cookie only accessible by the web server
            signed: false // Indicates if the cookie should be signed
          }
    
          // Set cookie
          res.cookie('user_sid', users[0].id, options);
          req.session.user = users[0];
          var token = btoa(users[0].id);

          if(users[0].role === 'SUPER_ADMIN'){
            var tokenString = users[0].role + 'Bw0hbYL1iMxs4lz3xud28dKXuBzeyIgT';
            token = btoa(tokenString);
          }
          res.redirect('/l/dashboard?sessionId='+token);
        }

      });
    });
  });

app.get('/logout', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.clearCookie('user_sid');
  } 
  res.redirect('/');
});

// static files
app.use(express.static(path.join(__dirname, 'public')));

// starting the server
app.listen(app.get('port'), () => {
  console.log(`server on port ${app.get('port')}`);
});
