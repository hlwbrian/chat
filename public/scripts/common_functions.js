//Get cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

//Return YYYY-MM-DD H:i format
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

function formatDateChatList(date){
    if(date === '') return '';
    var d = new Date(date);
    var d2 = new Date();
    var ddiff = Math.floor( Math.abs(d2 - d) / (1000 * 60 * 60 * 24) );
    var month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();
    hour = d.getHours();
    minute = d.getMinutes();

    if(ddiff === 0){
        return hour + ':' + minute;
    }else if (ddiff === 1){
        return 'Yesterday';
    }else {
        return [year, month, day].join('-');
    }
}

//Common function to change tab menu
function changeTab(showClassName){
    if( !$('.'+showClassName).hasClass('active') ){
        $('.main').find('.active').removeClass('active');
        $('.'+showClassName).addClass('active');
        $('.toggleDiv').toggle();
    }     
}

//Check if the password & the confirm password fields are the same 
function confirmCheck(input) {
    if (input.value === $('#signup-password').val() || input.value.length < $('#signup-password').val().length) {
        $('#confirmText').hide();
        $('#signupBtn').prop('disabled', false);
    }else{
        $('#confirmText').show();
        $('#signupBtn').prop('disabled', true);
    }
}