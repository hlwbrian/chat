const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const xss = require('xss-clean');
const rateLimiter = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

//app.use(helmet());
if(process.env.ENVIRONMENT === 'dev'){
    app.use(morgan('dev'));
}

const limit = rateLimiter({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'requested too many times'
});
app.use('/login', limit);
app.use(express.json({limit : '10kb'}));
app.use(xss());
app.use(mongoSanitize());
app.use(cookieParser());

//Include all routes
app.use('/users/', userRoutes);
app.use('/chat/', chatRoutes);

module.exports = app;