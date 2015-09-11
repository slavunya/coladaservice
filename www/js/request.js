var scan = {
    slipObjectsArray: []
};
var moreinfostatus=false;
$(document).ready(function () {
    document.addEventListener("deviceready", onDeviceReady, false);
    loadContent('login','');
});

function onDeviceReady() {
    StatusBar.overlaysWebView(false);
}

var baseUrl = "http://coladaservices.de/test_icans26/api/scannerApi.php";

$(document).on('submit', '#login-form', function () {
    var login = $('input[name=login]').val();
    var password = $('input[name=password]').val();

    if (login.length == '0') {
        showAlert('Please input login', 'Message');
        //alert("Please input login");
        return false;
    }

    if (password.length == 0) {
        showAlert('Please input password', 'Message');
        //alert("Please input password");
        return false;
    }

    var od = {};
    od.login = login;
    od.password = password;

    $.post(baseUrl, od, function (result) {

        console.log("Login");
        console.log(result);

        if (result['status'] == "success") {
            loadContent('main','');
        } else {
            showAlert('The user with that login and password is not found', 'Message');
            //alert("The user with that login and password is not found");
        }

    }, "json");

    event.preventDefault();
});

function loadContent(page,result) {
    if (page === 'login') {
        $('#page').load('content.html #login', function () {

        });
    }
    if (page === 'main') {
        $('#page').load('content.html #main', function () {
            getlocation();
        });
    }
    if (page === 'location_history') {
        $('#page').load('content.html #location_history', function () {
             for(var i in result.data){
             var   obj=result.data[i];
                $(".content_data").append("<div><p>"+obj.locations_name+":"+obj.num_locations+"</p></div>");
            }
           var button = "<button class=\"reject\" onclick=\"loadContent('main','')\">Back</button>";
           $(".content").append( "<div id=\"buttons\">" + button + "</div>");
          
        });
    }
}

function formSubmit() {

    var select = $('select[name=list]').val();
    if (select == '0') {
        showAlert('Please select location', 'Message');
        //alert("Please select location");
        return false;
    }

    var id = $('input[name=guid]').val();
    if (id.length == 0) {
        showAlert('Please scan the code', 'Message');
        //alert("Please scan the code");
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
        $(".content").show(100);
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
                    time = ("<p id='scan-time'>Last scanned: " + finalytime + "</p><a onclick=\"moreinfo('"+obj.guid+"')\">More info</a>");
                }
                break;
        }


        if (result.status_user !== "1") {
            userData = "<p>" + obj.firstname + " " + obj.lastname + "</p><p>" + obj.guid + "</p>";
        }
        $('.content').html("<div class=\"content_data\">" + userData + "" + time + "<div id=\"moreInfo\"><ul id=\"moreinfolist\"></ul></div></div>" + "<div id=\"buttons\">" + button + "</div>");
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

function getTime() {
    var date = new Date();
    var time = date.getTime();
    return time;
}

function clean() {
    $(".content").hide(100);
    $("#submitform").show(100);
    $('input[name=guid]').val("");
}

function showAlert(message, title) {
    navigator.notification.alert(
            message,
            null,
            title,
            'Ok'
            );
}
function scanBarcode() {


    scanBarcodeProcess(afterScanCode);


    function afterScanCode(status, result) {
//        log('result.format: ' + result.format + '; text:' + result.text + '; cancelled: ' + result.cancelled);
        if (status.error) {
            showErrorMessage(result);
            return;
        }

        if (!(result.cancelled === false || result.cancelled === 0)) {
            log('scanning cancelled');
            return;
        }
//        if (!(result.format === 'CODE_128')) {
//            showErrorMessage(eMsg.wrongCodeType);
//            return;
//        }

        var scannedCode = result.text;
        for (var i in scan.slipObjectsArray) {
            var slipObject = scan.slipObjectsArray[i];
            if (slipObject.slip === scannedCode) {
                showErrorMessage(eMsg.codeScanned);
                return false;
            }
        }

        addSlipNumberToView(scannedCode);

    }
    return false;
}



function scanBarcodeProcess(callback) {
    cordova.plugins.barcodeScanner.scan(
            function (result) {
                var status = {success: true, error: false};
                callback(status, result);
            },
            function (error) {

                alert("Scanning failed: " + error);
                var status = {success: false, error: true};
                callback(status, error);
            }
    );


}

function addSlipNumberToView(slipNumber) {

    $('#guid').val(slipNumber);
    formSubmit();
//     $('#ContentPlaceHolder1_gvProductList_DXSE_I').val(slipNumber);

}
function gethistory() {
    var od = {};
    od.history = "get";
    $.post(baseUrl, od, function (result) {
        console.log(result);
        if(result.status=="success"){
            loadContent("location_history",result);
           
    }
       
        
    }, "json");
}
function moreinfo(guid){
    if(!moreinfostatus){
     var od = {};
    od.user_history = "get";
    od.guid=guid;
    $.post(baseUrl, od, function (result) {
        console.log(result);
        $("#moreinfolist").css({'display':'block'});
        var status="";
      
        for(var i in result.data){
             var obj=result.data[i];
            if(obj.status==1){
                status="red";
            }
            else {
                status="green";
            }
            var obj=result.data[i];
             var date = new Date();
                    date.setTime(obj.date);
                    var day = date.getDate();
                    var month = date.getUTCMonth() + 1;
                    var year = date.getFullYear();
                    var hours = date.getHours();
                    var minutes = date.getMinutes();
            $("#moreinfolist").append("<li class="+status+">"+obj.locations_name+" "+year+"/"+month+"/"+day+":"+hours+":"+minutes+"</li>");
           
        }
       
        
    }, "json");
    moreinfostatus=true;
}
else {
    $("#moreinfolist").hide(100);
     moreinfostatus=false;
}
}