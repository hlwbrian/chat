const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const axios = require('axios');

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
//TODO create chat controller file
io.on('connection', function(socket) {
    //If user is in chatroom list
    if(socket.request._query['page'] === 'chatlist'){
        let rooms = socket.request._query['chat'].split(',');

        for(let value of rooms){
            let roomName = `chatroom ${value}`;
            socket.join(roomName);
        }
    }
    //if user is in chatroom inner page
    else{
        const roomName = `chatroom ${socket.request._query['chat']}`;
        socket.join(roomName);

        socket.on('chat message', msg => {
            const resultMsg = msg;
            let userID = socket.request._query['username'].split('#')[1];
            sendToRoom(roomName, userID, resultMsg);
        });
    }
    
    //When user disconnected
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

//function sendToList()

function sendToRoom(roomName, userID, msg){
    //save to db before save send
    //TODO update url path
    let roomID = roomName.split(' ')[1];
    let timestamp = '';

    axios.post('http://localhost:3000/chat/save', {
        chatID : roomID,
        msg: msg,
        userID: userID,
        serverSecret: '5sa9gkj#7w'
    })
    .then(function (response) {
        // handle success
        console.log(response.data.msg);
        timestamp = response.data.timestamp;

        //send data
        io.in(roomName).emit('receive', msg);
        io.in(roomName).emit('chatroom list update', `${roomName}#${msg}#${timestamp}`);
    })
    .catch(function (error) {
        // handle error
        console.log(error);
    })
}

//Handle unexpected error
process.on('unhandledRejection', err => {
    console.log('unexpected error on run time');
    console.log(err.name, err.message);
    server.close( () => {
        process.exit(1);
    });
});