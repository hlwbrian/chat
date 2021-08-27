/* LOGIN Page functions */
/* Sign up function: pass related information to create an account */
$('#signupForm').submit( function(event) {
    //prevent refresh the page when submit and wait for server response
    event.preventDefault();
    
    //prepare related data to be passed to server side
    var data = {
        username : $('#signup-username').val(),
        password : $('#signup-password').val(),
        passwordConfirm : $('#passwordConfirm').val()
    }
    
    //making request to server side
    $.ajax({
        type: 'POST',
        url: '/users/signup',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        async: false,
        data: JSON.stringify(data),
        error: function(err){       
            //handle mongoDB duplicated error       
            if(err.responseJSON.error.statusCode === 400){
                var fieldName = err.responseJSON.message.substring(err.responseJSON.message.lastIndexOf(':') + 1).trim();
                var errMsg = 'Please use another value for ' + fieldName;
                $('.loginPage__form-signup .errorMsg').html(errMsg);          
            }
        },
        success: function(data){
            //if signup successful, then go to chatlist page
            window.location = '/content/chatlist.html';
        }                
    });
});

/* Login function: pass username & password to login */
function login(){
    //prepare related data to be passed to server side
    var data = {
        username : $('#login-username').val(),
        password : $('#login-password').val()
    }
    
    //making request to server side
    $.ajax({
        type: 'POST',
        url: '/users/login',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        async: false,
        data: JSON.stringify(data),
        error: function(err){
            //if server does not find related user informaiton
            if(err.status === 404){
                var errMsg = '*Incorrect password or username, please check again.';
                $('.loginPage__form-login .errorMsg').html(errMsg);
            }
        },
        success: function(){
            //go to chat list page
            window.location = '/content/chatlist.html';
        }
    });
}

/* Element listener */
//Submit login form when user try to login
$('#loginForm').submit( function(event) {
    event.preventDefault();
    login();
});

//check if the password & the confirm password fields are the same 
function confirmCheck(input) {
    if (input.value === $('#signup-password').val() || input.value.length < $('#signup-password').val().length) {
        $('#confirmText').hide();
        $('#signupBtn').prop('disabled', false);
    }else{
        $('#confirmText').show();
        $('#signupBtn').prop('disabled', true);
    }
}

//when user try to register/login an account, change to respective section
$('.registerToggle').click(function(){
    $('.loginPage__form-login').toggle();
    $('.loginPage__form-signup').toggle();
});

/* CHATROOMLIST functions */
var path = window.location.pathname;
var curPage = path.split('/').pop();
if( curPage === 'chatlist.html' ){
    var currentUser;
    var allChannel = [];
    
    /* Initial page function, load all the chatroom detail for the user */
    (function init(){
        $.ajax
        ({
            type: "GET",
            url: "/chat/getChatList",
            dataType: 'json',
            async: false,
            //get the token from cookie and send to server in request's header
            headers: {
                "authorization": "Bearer " + getCookie('chatJWT')
            },
            success:function(data) {
                //Display user information from server
                $('.phone').text( 'Phone: ' + data.user.phone);
                $('.email').text( 'Email: ' + data.user.email);
                $('.userID').text(data.user.username + '#' + data.user.userID);
                $('.moreInfo__username .userID').text(data.user.username);
                $('.moreInfo__username .userID').addClass(data.user.username);
                $('.icon').attr("src", '/images/' + data.user.icon);
                currentUser = data.user.username + '#' + data.user.userID;

                //Sort the chatroom by time, the chatroom with latest message on top
                data.records.sort( (a, b) => {
                    let timeA, timeB;
                    timeA = (a.conversations[0])? new Date(a.conversations[0].timestamp) : new Date(a.chatCreate);
                    timeB = (b.conversations[0])? new Date(b.conversations[0].timestamp) : new Date(b.chatCreate);

                    return timeB - timeA;                 
                });   

                //Display the chatroom details
                if(data.records.length > 0){
                    var html = '', datetime, datetimeFormat;
                    for(var i = 0; i < data.records.length; i++){                            
                        html += '<li data-id="'+data.records[i].chatID+'" class="chatroom" id="chatroom'+data.records[i].chatID+'">' + 
                                '<div class="left"><span></span><img src="/images/'+ data.records[i]['icon'] +'" class="icon" /></div>' +
                                '<div class="right"><span class="roomName">' + data.records[i]['chatroomName'] + '</span><br/>';
                                                                
                        //Join related chatroom, to listen if any message are send to this user
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

                    //Add unread remark for the channel that this user have not read yet
                    for(var i = 0; i < data.records.length; i++){
                        if(data.records[i].conversations.length > 0){
                            if(!data.records[i].conversations[0].read.includes('' + data.user.userID)){
                                $('#chatroom'+data.records[i].chatID + ' .left span').addClass('unreadIcon');
                                $('#chatroom'+data.records[i].chatID + ' .right').addClass('halfWidthRight');
                            }
                        }
                    }
                }
            }
        });

        //get all the params
        var urlParams = new URLSearchParams(window.location.search);
        /*
        When upload an image,
        server side will first create a copy in /contnet/images,
        if success, server will send a uploadImg param with image name value to user,
        then user will use this info to make the below request
        */
        var uploadImg = urlParams.get('uploadImg');

        //if successfully create a copy in db
        if(uploadImg){      
            //prepare data
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
                    //if image update success, change the icon
                    $('.moreInfo__icon .icon').attr('src', '/images/' + data.img);
                },
                error:function(data){
                }
            });

            //hide the params
            history.pushState(null, '', '/content/chatlist.html');
        }
    })();

    /* Create Chatroom */
    $('#createChat').submit(function(event){
        //prevent reload
        event.preventDefault();

        //prepare data
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
                        '<div class="left"><img src="/images/'+ data.records['icon'] +'" class="icon" /></div>' +
                        '<div class="right"><span class="roomName">' + data.records['chatroomName'] + '</span><br/>' +
                        '</li>';
                        
                $('#chatlist').prepend(html);
            }
        });
    });

    /* Update personal information */
    $('#updateName').submit(function (event){
        //prevent reload
        event.preventDefault();

        //prepare data
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

    /* Event listeners */
    $('#chatlist').delegate( 'li', 'click', function(){
        window.location = '/content/chatroom.html?user='+ encodeURIComponent($('.userID').text()) +'&chatroom=' + $(this).attr('data-id');
    });

    $('.createChatBtn').click(function() {
        $('.chatlistPage__createChat').toggle();
    });

    $('.logout').click(function(){
        document.cookie = "chatJWT=; expires = Thu, 01 Jan 1970 00:00:00 GMT"
        window.location = '/content/login.html';
    });

    $('.moreBtn').click(function() {
        ($('.moreBtn').text() === 'more')? $('.moreBtn').text('less') : $('.moreBtn').text('more');
        $('.moreInfo').toggle();
    });

    $('.moreInfo__icon .overlay').click(function() {
        $('#profileImageBtn').trigger('click');
   });

   $('#profileImageBtn:file').change(function (){
       $('#fileUpload .button').trigger('click');
    });

    $('.moreInfo__username textarea').on('input', function(){
        if( !$('.moreInfo__username textarea').hasClass($('.moreInfo__username textarea').val()) ){
            $('.updateNameBtn').prop('disabled', false);
        }else{
            $('.updateNameBtn').prop('disabled', true);
        }
    });

    $('.moreInfo .closeBtn').click(function(){
        $('.moreInfo').css('display', 'none');
    })

    $('.updateNameBtn').click(function() {
        $('#update-username').val($('.moreInfo__username .userID').val().toLowerCase());
        $('#updateName .button').trigger('click');
    });

    const socket = io({query: {"username" : currentUser , 'chat' : allChannel, 'page' : 'chatlist'}}); 

    //socket listen to the chatroom that has message sent out
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
}else if( curPage === 'chatroom.html' ){
            //Drop and Add image functions
            function allowDrop(ev) {
                ev.preventDefault();
            }

            function drop(ev) {
                ev.preventDefault();
                //get fileList when an image drop on page
                var data = ev.dataTransfer.files;
                $('.sendImageInput')[0].files = data;
               
                //show image preview section
                $('#imagePreview').show();
                var data = $('.sendImageInput')[0].files[0];
                if (data) {
                    $('#previewImg').attr('src',  URL.createObjectURL(data));
                }
            }

             /* Page init funcction */
        (function init() {
            //get params
            var urlParams = new URLSearchParams(window.location.search);

            //get chatroom data from param
            var data = {
                currentChatID : urlParams.get('chatroom')
            }

            /* get the conversation in that chatroom */
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
                //if conversation/chatroom not found
                error:function(data){
                },
                success:function(data) {
                    let chatroomName = data.content[0].chatroomName;
                    let content = data.content[0].conversations;
                    let members = data.content[0].members;
                    let icon = data.content[0].icon;
                    let html = '';
                    
                    $('#header').text(chatroomName);
                    $('#icon').attr('src', '/images/' + icon);
                    if(content.length > 0){
                        for(var value of content){
                            var senderStyle = (urlParams.get('user') === value.sender)? 'right' : 'left';

                            //if image message
                            if( (/[a-z0-9].jpg|.png|.jpeg/).test(value.message) ){
                                html += '<li><div class="messageImg message  '+senderStyle+'">' +
                                    '<div class="sender">' + value.sender + '</div>' +
                                    '<div class="timestamp">' + formatDate(value.timestamp) + '</div>' +
                                    '<div class="img"><img src="/images/'+value.message+'" data-src="'+value.message+'" onError="$(this).hide(); $(this).parent().find(\'span\').show();"></div>' +
                                    '<div class="hiddenMsg"><span style="display:none">' +value.message+ '</span></div>' +
                                '</div></li>';
                            }
                            //if text message
                            else{
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

            /*
            same logic in chatlist image
            but with more data, chatroom & user
            */
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
                        $('#icon').attr('src', '/images/' + data.icon);
                    },
                    error:function(data){
                        console.log(data);
                    }
                });

                history.pushState(null, '', '/content/chatroom.html?user=' + encodeURIComponent(user) + '&chatroom=' + chatroom);
            }
        })();

        /* Socket io handling */
        var urlParams = new URLSearchParams(window.location.search);
        var currentUser = urlParams.get('user');
        const socket = io({query: {"username" : currentUser , 'chat' : urlParams.get('chatroom'), 'page' : 'chatroom'}}); 
        
        var form = document.getElementById('form');
        var input = document.getElementById('input');

        //when user send message
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (input.value) {
                socket.emit('chat message', input.value);
                input.value = '';
            }
        });

        //when user receive message
        socket.on('receive', msg => {
            var message = msg.split('#')[0];
            var timestamp = msg.split('#')[1];
            var sender = msg.split('#')[2] + '#' + msg.split('#')[3];
            var senderStyle = (urlParams.get('user') === sender)? 'right' : 'left';

            //display message
            if( (/[a-z0-9].jpg|.png|.jpeg/).test(msg) ){
                $('#messages').append('<li><div class="messageImg message '+senderStyle+'">' +
                                    '<div class="sender">' + sender + '</div>' +
                                    '<div class="timestamp">' + formatDate(timestamp) + '</div>' +
                                    '<div class="img"><img src="/images/'+message+'" data-img="'+message+'" onError="$(this).hide(); $(this).parent().find(\'span\').show();"></div>' +
                                    '<div class="hiddenMsg"><span style="display:none">' +message+ '</span></div>' +
                                    '</div></li>');
            }else{
                $('#messages').append('<li><div class="message '+senderStyle+'">' +
                                    '<div class="sender">' + sender + '</div>' +
                                    '<div class="timestamp">' + formatDate(timestamp) + '</div>' + 
                                    '<div class="content">' + message + '</div>' +                                   
                                '</li>');
            }

            //get chatroom data from param
            var data = {
                currentChatID : urlParams.get('chatroom')
            }

            //when user receive data update the read status
            $.ajax
                ({
                    type: "PATCH",
                    url: "/chat/updateRead",
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json',
                    async: false,
                    data: JSON.stringify(data),
                    headers: {
                        "authorization": "Bearer " + getCookie('chatJWT')
                    },
                    success:function(data) {
                    },
                    error:function(data){
                    }
                });

            //scroll to bottom
            $(".chatroom").animate({ scrollTop: $('#messages').height() }, 1000);
        });

        var sendImg = urlParams.get('sendImage');
        var chatroom = urlParams.get('chatroom');
        
        if(sendImg){
            input.value = sendImg;

            $('#form button').trigger('click');
            history.pushState(null, '', '/content/chatroom.html?user=' + encodeURIComponent(currentUser) + '&chatroom=' + chatroom);
        }

        //Event listener
        //let user to select image when user clicks "image" button
        function previewImage() {
            $('.sendImageInput').trigger('click');
        }

        //detect when fileList data is changed
        $(".sendImageInput:file").change(function (){
            $('#imagePreview').show();
            var data = $('.sendImageInput')[0].files[0];
            if (data) {
                $('#previewImg').attr('src',  URL.createObjectURL(data));
            }
        });

        //let user to upload image when they click "send" in image preview section
        $('#imagePreview button').click(function(){
            $('#sendImage button').trigger('click');
        });

        //go back button, back to chatlist page
        $('.goBack').click(function(){
            window.location = '/content/chatlist.html';
        });

        //create urlParams as the urlParams in IIFE function is not available
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

        //update chatroom name function
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
                },
                success:function(data) {
                    $('#header').text($('#chatroomName').val());
                }
            });
        });

        //Leave chat function
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
                },
                success:function(data) {
                    window.location = '/content/chatlist.html';
                }
            });
        });

        //Toggle more option section
        $('.moreBtn span').click(function(e) {
            var moreBtnText = $('.moreBtn span').text();
            $('.moreBtn span').text( moreBtnText === 'More'? 'Less' : 'More');
            $('.moreOption').toggle();
        });

        //Scroll to end
        $(document).ready(function(){
            $(".chatroom").animate({ scrollTop: $('#messages').height() }, 0);
        })
}