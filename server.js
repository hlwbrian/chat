const express = require('express');
const { Server } = require('socket.io');
const port = 3080;

const app = express();
const server = app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
});

//Create socket on server
const io = new Server(server);

//Return page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/content/index.html');
});

//Create socket listener
io.on('connection', (socket) => {
    console.log('A user is connected');
    socket.broadcast.emit('Broadcasting');
    
    //When sending data
    socket.on('chat message', msg => {
        console.log(`message : ${msg}`);
    });

    //When user disconnected
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

//Handle unexpected error
process.on('unhandledRejection', err => {
    server.close( () => {
        process.exit(1);
    });
});