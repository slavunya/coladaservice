$(document).ready(function () {
    loadContent('login');
    document.addEventListener("deviceready", checkFullReady, false);
});

function checkFullReady() {
    if(device.platform !== 'Android'){
        StatusBar.overlaysWebView(false);
    }
}

var baseUrl = "http://coladaservices.de/test_icans26/api/scannerApi.php";

$(document).on('submit','#login-form',function(){
    var login = $('input[name=login]').val();
    var password = $('input[name=password]').val();

    var od = {};
    od.login = login;
    od.password = password;

    $.post(baseUrl, od, function (result) {

        console.log("Login");
        console.log(result);

        if(result['status'] =="success"){
            loadContent('main');
        } else{
            alert("The user with that login and password is not found");
        }

    }, "json");

    event.preventDefault();
});

function loadContent(page) {
    if (page === 'login') {
        $('#page').load('content.html #login', function () {

        });
    }
    if (page === 'main') {
        $('#page').load('content.html #main', function () {
            getlocation();
        });
    }
}

function formSubmit() {

    var select = $('select[name=list]').val();
    if (select == '0') {
        alert("Please select location");
        return false;
    }

    var id = $('input[name=guid]').val();
    if (id.length == 0) {
        alert("Please scan the code");
        return false;
    }

    var od = {};
    od.guid = id;
    od.location_id = select;

    $.post(baseUrl, od, function (result) {

        console.log("Submit");
        console.log(result);
        var obj = result.data;

        var userData = "";
        var button = "";
        var time = "";

        $("#submitform").hide(100);
        $("#content").show(100);
        switch (result.status_user) {
            case "1":
                userData = "<div>The code is not found</div>";
                button = "<button class=\"reject\" onclick=\"clean()\">Back</button>";
                break;
            case "2":
                button = "<button class=\"accept_on\" onclick=\"accept('" + obj.guid + "','" + od.location_id + "')\">Accept</button>";
                break;
            case "3":
                button = "<button class=\"accept\" onclick=\"accept('" + obj.guid + "','" + od.location_id + "')\">Accept</button><button class=\"reject\" onclick=\"reject('" + obj.guid + "','" + od.location_id + "')\">Reject</button>";
                if (result.scanned_data) {
                    var date = new Date();
                    date.setTime(result.scanned_data.date);
                    var day = date.getDate();
                    var month = date.getUTCMonth() + 1;
                    var year = date.getFullYear();
                    var hours = date.getHours();
                    var minutes = date.getMinutes();
                    var finalytime = year + ":" + month + ":" + day + "-" + hours + ":" + minutes;
                    time = ("<p id='scan-time'>Last scanned: " + finalytime+"</p>");
                }
                break;
        }


        if (result.status_user !== "1") {
            userData = "<p>" + obj.firstname + " " + obj.lastname + "</p><p>" + obj.guid + "</p>";
        }
        $('#content').html("<div class=\"divs\">" + userData + "" + time + "</div>" + "<div id=\"buttons\">" + button + "</div>");
    }, "json");
}

function getlocation() {
    var od = {};
    od.locations = "get";
    $.post(baseUrl, od, function (result) {

        console.log("Location");
        console.log(result);

        for (i in result.data) {
            var obj = result.data[i];
            $('#list').append("<option value=" + obj.id + ">" + obj.locations_name + "</option>");
        }
    }, "json");
}

function accept(guid, location_id) {
    var od = {};
    od.date = getTime();
    od.guid = guid;
    od.reject = 0;
    od.location_id = location_id;
    $.post(baseUrl, od, function (result) {
        console.log("accept");
        console.log(result);

        if (result.status === "success") {
            clean();
        }

    }, "json");
}

function reject(guid, location_id) {
    var od = {};
    od.date = getTime();
    od.reject = 1;
    od.guid = guid;
    od.location_id = location_id;
    $.post(baseUrl, od, function (result) {
        console.log("Reject");
        console.log(result);
        if (result.status === "success") {
            clean();
        }

    }, "json");
}

function getTime(){
    var date = new Date();
    var time = date.getTime();
    return time;
}

function clean() {
    $("#content").hide(100);
    $("#submitform").show(100);
    $('input[name=guid]').val("");
}