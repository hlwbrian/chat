/* IMPORT all library packages for the app */
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const xss = require('xss-clean');
const rateLimiter = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const fileUpload = require('express-fileupload');

/* INIT express app */
const app = express();

/* IMPORT all routes */
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const errorControl = require('./controllers/errorController');

/* PROTECT express app by setting various HTTP headers */
//app.use(helmet());

/* SHOW access info if it is developing environment */
if(process.env.ENVIRONMENT === 'dev'){
    app.use(morgan('dev'));
}

/* LIMIT request times within a time range */
const limit = rateLimiter({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'requested too many times'
});
app.use('/users/login', limit);
app.use(express.json({limit : '10kb'}));
app.use(xss());
app.use(mongoSanitize());
app.use(cookieParser());
app.use(fileUpload());

/* SET public files */
app.use(express.static(`${__dirname}/public`));

/* INCLUDES all the routes */
app.use('/users/', userRoutes);
app.use('/chat/', chatRoutes);

/* Error control */
app.use(errorControl);

module.exports = app;