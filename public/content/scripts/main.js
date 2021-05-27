//FROM login page
var register = function(){
    $.ajax({
        type: 'POST',
        url: '/users/signup',
        dataType: 'json',
        contentType: 'application/json',
        data: {}
    })
}

$('#signupForm').submit( function(event) {
    event.preventDefault();

    var data = {
        username : $('#signup-username').val(),
        password : $('#signup-password').val(),
        passwordConfirm : $('#passwordConfirm').val(),
        email : $('#email').val(),
        phoneNo : $('#phoneNo').val()
    }

    $.ajax({
        type: 'POST',
        url: '/users/signup',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        async: false,
        data: JSON.stringify(data),
        error: function(err){              
            if(err.responseJSON.error.statusCode === 400){
                var fieldName = err.responseJSON.message.substring(err.responseJSON.message.lastIndexOf(':') + 1).trim();
                if(fieldName === 'phoneNo') fieldName = 'phone number';
                var errMsg = 'Please use another value for ' + fieldName;
                $('.singupContainer .errorMsg').html(errMsg);
            }
        },
        success: function(data){
            window.location = '/content/chatlist.html';
        }                
    });
});

//Common function
function login(){
    var data = {
        username : $('#login-username').val(),
        password : $('#login-password').val()
    }
    
    $.ajax({
        type: 'POST',
        url: '/users/login',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        async: false,
        data: JSON.stringify(data),
        error: function(err){
            console.log(err);
            if(err.status === 404){
                var errMsg = '*Incorrect password or username, please check again.';
                $('.loginContainer .errorMsg').html(errMsg);
            }
        },
        success: function(){
            window.location = '/content/chatlist.html';
        }
    });
}

$('#loginForm').submit( function(event) {
    event.preventDefault();
    login();
});

//function to check if password confirm are matched
function confirmCheck(input) {
    if (input.value === $('#signup-password').val()) {
        $('#confirmText').hide();
        $('#signupBtn').prop('disabled', false);
    }else{
        $('#confirmText').show();
    }
}

$('.register').click(function(){
    $('.loginContainer').toggle();
    $('.singupContainer').toggle();
});

function allowDrop(ev) {
    ev.preventDefault();
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.files;
    $('.sendImageInput')[0].files = data;
    $('#sendImage button').trigger('click');
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function formatDate(date){
    if(date === '') return '';
    var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();
    hour = d.getHours();
    minute = d.getMinutes();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-') + ' ' + hour + ':' + minute;
}

(function init() {
    var urlParams = new URLSearchParams(window.location.search);
    var data = {
        currentChatID : urlParams.get('chatroom')
    }

    $.ajax
    ({
        type: "POST",
        url: "/chat/initConversation",
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        async: false,
        data: JSON.stringify(data),
        headers: {
            "authorization": "Bearer " + getCookie('chatJWT')
        },
        error:function(data){
        },
        success:function(data) {
            let chatroomName = data.content[0].chatroomName;
            let content = data.content[0].conversations;
            let members = data.content[0].members;
            let icon = data.content[0].icon;
            let html = '';
            
            $('#header').text(chatroomName);
            $('#icon').attr('src', '/content/images/' + icon);
            if(content.length > 0){
                for(var value of content){
                    var senderStyle = (urlParams.get('user') === value.sender)? 'right' : 'left';

                    if( (/[a-z0-9].jpg|.png/).test(value.message) ){
                        html += '<li><div class="messageImg message  '+senderStyle+'">' +
                            '<div class="sender">' + value.sender + '</div>' +
                            '<div class="timestamp">' + formatDate(value.timestamp) + '</div>' +
                            '<div class="img"><img src="/content/images/'+value.message+'" alt="'+value.message+'" onError="$(this).hide(); $(this).parent().find(\'span\').show();"></div>' +
                            '<div class="hiddenMsg"><span style="display:none">' +value.message+ '</span></div>' +
                        '</div></li>';
                    }else{
                        html += '<li><div class="message '+senderStyle+'">' +
                            '<div class="sender">' + value.sender + '</div>' +
                            '<div class="timestamp">' + formatDate(value.timestamp) + '</div>' + 
                            '<div class="content">' + value.message + '</div>' +                                   
                        '</div></li>';
                    } 
                }
                $('#messages').append(html);
            }

            html = '';
            for(var value of members){
                html += '<li>' +
                    value +
                    '</li>';
            }

            $('#members').append(html);
        }
    });

    var urlParams = new URLSearchParams(window.location.search);
    var uploadImg = urlParams.get('uploadImg');
    var chatroom = urlParams.get('chatroom');
    var user= urlParams.get('user');

    if(uploadImg){      
        var data = {
            currentChatID : urlParams.get('chatroom'),
            icon: uploadImg
        }    

        $.ajax
        ({
            type: "POST",
            url: "/chat/changeIcon",
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            async: false,
            data: JSON.stringify(data),
            headers: {
                "authorization": "Bearer " + getCookie('chatJWT')
            },
            success:function(data) {
                $('#icon').attr('src', '/content/images/' + data.icon);
            },
            error:function(data){
                console.log(data);
            }
        });

        history.pushState(null, '', '/chatroom.html?user=' + encodeURIComponent(user) + '&chatroom=' + chatroom);
    }
})();

$('.goBack').click(function(){
    window.location = '/content/chatlist.html';
});

var urlParams = new URLSearchParams(window.location.search);
$('#addMemberForm').submit(function(event){
    event.preventDefault();
    var data ={
        username:  $('#username').val(),
        currentChatID : urlParams.get('chatroom')
    }
    
    $.ajax
    ({
        type: "POST",
        url: "/chat/addMember",
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        async: false,
        data: JSON.stringify(data),
        headers: {
            "authorization": "Bearer " + getCookie('chatJWT')
        },
        error:function(data){
            if(data.status === 404){
                alert(data.responseJSON.message);
            }
        },
        success:function(data) {
            var html = '<li>' + data.member + '</li>';

            $('#members').append(html);
        }
    });
});

$('#changeChatroom').submit(function(event) {
    event.preventDefault();

    var data ={
        chatroomName:  $('#chatroomName').val(),
        currentChatID : urlParams.get('chatroom')
    }

    $.ajax
    ({
        type: "PATCH",
        url: "/chat/changeChatName",
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        async: false,
        data: JSON.stringify(data),
        headers: {
            "authorization": "Bearer " + getCookie('chatJWT')
        },
        error:function(data){
            alert('failed');
        },
        success:function(data) {
            $('#header').text($('#chatroomName').val());
        }
    });
});

$('#leaveChat').submit(function(event) {
    event.preventDefault();

    var data ={
        currentChatID : urlParams.get('chatroom')
    }

    $.ajax
    ({
        type: "PATCH",
        url: "/chat/leave",
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        async: false,
        data: JSON.stringify(data),
        headers: {
            "authorization": "Bearer " + getCookie('chatJWT')
        },
        error:function(data){
            alert('failed');
        },
        success:function(data) {
            window.location = '/content/chatlist.html';
        }
    });
});

var currentUser = urlParams.get('user');
const socket = io({query: {"username" : currentUser , 'chat' : urlParams.get('chatroom'), 'page' : 'chatroom'}}); 

var form = document.getElementById('form');
var input = document.getElementById('input');

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';
    }
});

socket.on('receive', msg => {
    var message = msg.split('#')[0];
    var timestamp = msg.split('#')[1];
    var sender = msg.split('#')[2] + '#' + msg.split('#')[3];
    var senderStyle = (urlParams.get('user') === sender)? 'right' : 'left';

    if( (/[a-z0-9].jpg|.png/).test(msg) ){
        $('#message').append('<li><div class="message '+senderStyle+'">' +
                            '<div class="sender">' + value.sender + '</div>' +
                            '<div class="timestamp">' + formatDate(value.timestamp) + '</div>' +
                            '<div class="img"><img src="/content/images/'+value.message+'" alt="'+value.message+'" onError="$(this).hide(); $(this).parent().find(\'span\').show();"></div>' +
                            '<div class="hiddenMsg"><span style="display:none">' +value.message+ '</span></div>' +
                            '</div></li>');
    }else{
        $('#messages').append('<li><div class="message '+senderStyle+'">' +
                            '<div class="sender">' + sender + '</div>' +
                            '<div class="timestamp">' + formatDate(timestamp) + '</div>' + 
                            '<div class="content">' + message + '</div>' +                                   
                        '</li>');
    }
    $("html, body").animate({ scrollTop: $(document).height() }, 1000);
});

var sendImg = urlParams.get('sendImage');
var chatroom = urlParams.get('chatroom');

if(sendImg){
    input.value = sendImg;

    $('#form button').trigger('click');
    history.pushState(null, '', '/content/chatroom.html?user=' + encodeURIComponent(currentUser) + '&chatroom=' + chatroom);
}

//common function
var currentUser;
var allChannel = [];

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function formatDate(date){
    if(date === '') return '';
    var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();
    hour = d.getHours();
    minute = d.getMinutes();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-') + ' ' + hour + ':' + minute;
}

//Load chat list
(function init(){
    $.ajax
    ({
        type: "GET",
        url: "/chat/getChatList",
        dataType: 'json',
        async: false,
        headers: {
            "authorization": "Bearer " + getCookie('chatJWT')
        },
        success:function(data) {
            //insert user data
            $('.phone').text( 'Phone: ' + data.request.phone);
            $('.email').text( 'Email: ' + data.request.email);
            $('.userID').text(data.request.username + '#' + data.request.userID);
            $('.icon').attr("src", '/content/images/' + data.request.icon);
            currentUser = data.request.username + '#' + data.request.userID;

            data.records.sort( (a, b) => {
                let timeA, timeB;
                timeA = (a.conversations[0])? new Date(a.conversations[0].timestamp) : new Date(a.chatCreate);
                timeB = (b.conversations[0])? new Date(b.conversations[0].timestamp) : new Date(b.chatCreate);

                return timeB - timeA;                 
            });   

            //insert chatlist data
            if(data.records.length > 0){
                var html = '', datetime, datetimeFormat;
                for(var i = 0; i < data.records.length; i++){                            
                    html += '<li data-id="'+data.records[i].chatID+'" class="chatroom" id="chatroom'+data.records[i].chatID+'">' + 
                            '<div class="left"><span></span><img src="/content/images/'+ data.records[i]['icon'] +'" class="icon" /></div>' +
                            '<div class="right"><span class="roomName">' + data.records[i]['chatroomName'] + '</span><br/>';
                                                            
                    //for socket
                    allChannel.push(data.records[i].chatID);
                    if(data.records[i].conversations.length > 0){
                        
                        let message, timestamp;
                        message = (!data.records[i].conversations[0].hasOwnProperty('message'))? '' : data.records[i].conversations[0]['message'];
                        timestamp = (!data.records[i].conversations[0].hasOwnProperty('timestamp'))? data.records[i].chatCreate : data.records[i].conversations[0]['timestamp'];
                        html += '<span class="message">' + message + '</span><span class="timestamp">' + formatDate(timestamp) + '</span></div>';
                    }
                    
                    html += '</li>';
                }

                $('#chatlist').append(html);

                //add unread icon if the last message is not read
                for(var i = 0; i < data.records.length; i++){
                    if(data.records[i].conversations.length > 0){
                        if(!data.records[i].conversations[0].read.includes('' + data.request.userID)){
                            $('#chatroom'+data.records[i].chatID + ' .left span').addClass('unreadIcon');
                            $('#chatroom'+data.records[i].chatID + ' .right').addClass('halfWidthRight');
                        }
                    }
                }
            }
        }
    });

    var urlParams = new URLSearchParams(window.location.search);
    var uploadImg = urlParams.get('uploadImg');

    if(uploadImg){      
        var data = {
            icon: uploadImg
        }    
        $.ajax
        ({
            type: "PATCH",
            url: "/users/changeUserIcon",
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            async: false,
            data: JSON.stringify(data),
            headers: {
                "authorization": "Bearer " + getCookie('chatJWT')
            },
            success:function(data) {
                $('.img').attr('src', '/content/images/' + data.img);
            },
            error:function(data){
                console.log(data);
            }
        });

        history.pushState(null, '', '/content/chatlist.html');
    }
})();

//Create chat
$('#createChat').submit(function(event){
    event.preventDefault();
    var data ={
        username:  $('#username').val(),
        chatroom: $('#chatroomName').val()
    }
    
    $.ajax
    ({
        type: "POST",
        url: "/chat/create",
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        async: false,
        data: JSON.stringify(data),
        headers: {
            "authorization": "Bearer " + getCookie('chatJWT')
        },
        success:function(data) {
            //insert chatlist data
            var html='', datetime, datetimeFormat;
            html += '<li data-id="'+data.records.chatID+'" class="chatroom" id="chatroom'+data.records.chatID+'">' + 
                    '<div class="left"><img src="/content/images/'+ data.records['icon'] +'" class="icon" /></div>' +
                    '<div class="right"><span class="roomName">' + data.records['chatroomName'] + '</span><br/>' +
                    '</li>';
                    
            $('#chatlist').prepend(html);
        }
    });
});

$('#updateName').submit(function (event){
    event.preventDefault();
    var data = {
        username: $('#update-username').val(),
        password: $('#password').val(),
    }
    
    $.ajax
    ({
        type: "PATCH",
        url: "/users/updateUserName",
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        async: false,
        data: JSON.stringify(data),
        headers: {
            "authorization": "Bearer " + getCookie('chatJWT')
        },
        error:function(data){
            if(data.status === 400){
                alert(data.responseJSON.message);
            }else{
                alert('Incorrect password');
            }
        },
        success:function(data) {
            window.location = '/content/chatlist.html';
        }
    });
});

$('#chatlist').delegate( 'li', 'click', function(){
    window.location = '/content/chatroom.html?user='+ encodeURIComponent($('.userID').text()) +'&chatroom=' + $(this).attr('data-id');
});

$('.createChatBtn').click(function() {
    $('.createChatContainer').toggle();
});

$('.logout').click(function(){
    document.cookie = "chatJWT=; expires = Thu, 01 Jan 1970 00:00:00 GMT"
    window.location = '/login.html';
});

$('.moreBtn').click(function() {
    ($('.moreBtn').text() === 'more')? $('.moreBtn').text('less') : $('.moreBtn').text('more');
    $('.moreInfo').toggle();
});

const socket = io({query: {"username" : currentUser , 'chat' : allChannel, 'page' : 'chatlist'}}); 
socket.on('chatroom list update', msg => {
    var roomName = msg.split('#')[0].split(' ')[1];
    var message = msg.split('#')[1];
    var timestamp = msg.split('#')[2];

    $('#chatroom'+roomName+' .message').text(message);
    $('#chatroom'+roomName+' .timestamp').text( formatDate(timestamp) );
    
    $('#chatroom'+roomName + ' .left span').addClass('unreadIcon');
    $('#chatroom'+roomName + ' .right').addClass('halfWidthRight');
    //move the chat to the top
    var originalItem = $('#chatroom'+roomName);
    $('#chatroom'+roomName).remove();
    $('#chatlist').prepend(originalItem);
});