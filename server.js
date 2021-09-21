const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const axios = require('axios');

/* HANDLE for unexpected error on server starts */
process.on('uncaughtException', err => {
    console.log('Unexpected error on server starts');
    console.log(err.name, err.message);
    process.exit(1);
});

/* IMPORT config file for server */
dotenv.config({path: './config.env'});
//Set the port number for the server
const port = process.env.PORT || 3000;

/* IMPORT express app into the server */
const app = require('./app');

/* CONNECT to MongoDB */
//replace the connecting command password string with real password
const DB = process.env.DB.replace(
    '<password>',
    process.env.DB_PASSWORD
);
//Connect to MongoDB
mongoose
    .connect(DB, {
        useNewUrlParser: true, //Remove DeprecationWarning message on mongoose.connect()
        useCreateIndex: true, //Remove DeprecationWarning: collection.ensureIndex is deprecated
        useUnifiedTopology: true, //Remove Warning: Current Server Discovery and Monitoring engine is deprecated, and will be removed in a future version
        useFindAndModify: false // Make Mongoose use findOneAndUpdate()
    })
    .then( () => {
        console.log('MongoDB connected');
    });

/* START node.js server */    
const server = app.listen(port, () => {
    console.log(`The server is running on port ${port}`);
});

/* SEND login page as default page */
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/content/login.html'); 
});

//Create socket listener
const io = new Server(server);
let onlineUsers = [];

io.on('connection', function(socket) {
    //Push username to check online users
    let userID = socket.request._query['userID'];
    let chatroomName = '';
    let chatlist = socket.request._query['chatlist'].split(',');

    if(socket.request._query['chatID'] !== ''){
        /* Chatlist socket functions */
        for(let [key, value] of chatlist.entries()){
            socket.join(`Chatlist<%SPACE%>${value}`);
        }

        /* Chatroom socket functions */
        chatroomName = `Room<%SPACE%>${socket.request._query['chatID']}`;
        socket.join(chatroomName);
        
        //On send message
        socket.on('SendMSG', msg => {
            sendToRoom(chatroomName, userID, msg);
        });

        //On user change chatroom
        socket.on('ChangeRoom', msg => {
            socket.leave(`Room<%SPACE%>${msg.oldRoom}`);
            socket.join(`Room<%SPACE%>${msg.newRoom}`);

            //Change target chatroom ID for sending messages
            chatroomName = `Room<%SPACE%>${msg.newRoom}`;
        });
    }    

    //Get any users is typing now
    socket.on('userTyping', msg => {
        io.in(roomName).emit('showTyping', msg);
    });

    //Remove user who is done typing
    socket.on('userDoneTyping', msg => {
        io.in(roomName).emit('showDoneTyping', msg);
    });
    //TODO update login status
    /*if(onlineUsers.indexOf(socket.request._query['username']) < 0){
        onlineUsers.push(socket.request._query['username']);
        
        //Update logged-in status in MongoDB
        axios.patch(process.env.DOMAIN + 'users/updateLogin', {
            userID: userID,
            serverSecret: '5sa9gkj#7w',
            isLoggedIn: true
        })
        .then(function (response) {
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        });
    }*/

    //If user is in chatroom list
    /*if(socket.request._query['page'] === 'chatlist'){
        let rooms = socket.request._query['chat'].split(',');
        let username = socket.request._query['username'];

        for(let value of rooms){
            let roomName = `chatroom ${value}`;
            socket.join(roomName);

            io.in(roomName).emit('onlineMsg', `${username}`);
        }
    }
    //if user is in chatroom inner page
    else{
    }*/
    
    //When user disconnected
    socket.on('disconnect', () => {
        /*onlineUsers = onlineUsers.filter((curVal) => {
            return (curVal != socket.request._query['username']);
        });

        let rooms = socket.request._query['chat'].split(',');
        let username = socket.request._query['username'];
        let lastSeenTime = new Date();
        lastSeenTimeFormat = `${lastSeenTime.getFullYear()}/${lastSeenTime.getMonth()}/${lastSeenTime.getDate()} ${lastSeenTime.getHours()}:${lastSeenTime.getMinutes()}`;
        for(let value of rooms){
            let roomName = `chatroom ${value}`;
            io.in(roomName).emit('offlineMsg', `${username}#${lastSeenTimeFormat}`);
        }

        //Update logged-out status in MongoDB
        axios.patch(process.env.DOMAIN + 'users/updateLogin', {
            userID: userID,
            serverSecret: '5sa9gkj#7w',
            isLoggedIn: false
        })
        .then(function (response) {
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        });

        console.log('User disconnected');*/
    });
});

//function sendToList()
function sendToRoom(roomName, userID, msg){
    //save to db before save send
    let roomID = roomName.split('<%SPACE%>')[1];
    let timestamp = '';
    
    axios.post(process.env.DOMAIN + 'chat/save', {
        chatID : roomID,
        msg: msg,
        userID: userID,
        serverSecret: '5sa9gkj#7w'
    })
    .then(function (response) {
        // handle success
        timestamp = response.data.timestamp;
        
        //send data in chatroom
        io.in(roomName).emit('Receive', `${msg}#${response.data.timestamp}#${userID}#${response.data.content._id}`);
        //update chatlist
        io.in(`Chatlist<%SPACE%>${roomID}`).emit('ChatlistUpdate', `${msg}#${response.data.timestamp}#${roomID}#${userID}`);
    })
    .catch(function (error) {
        // handle error
        console.log(error);
    })
}

/* HANDLE unexpected error on server runs */
process.on('unhandledRejection', err => {
    console.log('unexpected error on run time');
    console.log(err.name, err.message);
    server.close( () => {
        process.exit(1);
    });
});