const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

//Unexpected error server starts
process.on('uncaughtException', err => {
    console.log('Unexpected error on server starts');
    console.log(err.name, err.message);
    process.exit(1);
});

//import setting
dotenv.config({path: './config.env'});
const port = process.env.PORT || 3000;
const app = require('./app');

//connect to MongoDB Atlas
const DB = process.env.DB.replace(
    '<password>',
    process.env.DB_PASSWORD
);
mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then( () => {
        console.log('MongoDB connected');
    });

const server = app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
});

//Create socket on server
const io = new Server(server);

//Return page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/content/login.html'); 
});

//Create socket listener
io.on('connection', function(socket) {
    const roomName = `chatroom ${socket.request._query['chat']}`;

    socket.join(roomName);
    socket.on('chat message', msg => {
        const resultMsg = `${socket.request._query['username']} : ${msg}`;
        sendToRoom(roomName, resultMsg);
    });

    //When user disconnected
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

function sendToRoom(roomName, msg){
    io.in(roomName).emit('receive', msg);
}

/*io.on('connection', (socket) => {
    console.log(`A user is connected:`);   

    const roomName = `chatroom ${socket.request._query['chat']}`;

    socket.join('roomName');
    //When sending data
    socket.on('chat message', msg => {
        console.log(`${socket.request._query['username']} : ${msg}`);
        //socket.broadcast.to(roomName).emit('receive', `${socket.request._query['username']} : ${msg}`);
        socket.in('roomName').emit('receive', `${socket.request._query['username']} : ${msg}`);
    });

    //When user disconnected
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});*/

//Handle unexpected error
process.on('unhandledRejection', err => {
    console.log('unexpected error on run time');
    console.log(err.name, err.message);
    server.close( () => {
        process.exit(1);
    });
});