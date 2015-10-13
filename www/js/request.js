var scan = {
    slipObjectsArray: []
};
var login = '';
var password = '';
var checked = false;
var moreinfostatus = false;
var offlinemode = false;
var scans = [];
var scannerAuto = true;
var currlocation = '';
$(document).ready(function () {
    document.addEventListener("deviceready", onDeviceReady, false);
    loadContent('login', '');
});
var store = window.localStorage;
function onDeviceReady() {
    StatusBar.overlaysWebView(false);
}
var baseUrl = "https://seera.de/scanner-api/index.php";


$(document).on('submit', '#login-form', function () {
    login = $('input[name=login]').val();
    password = $('input[name=password]').val();

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
//    var user={login:od.login,password:od.password};
    store.setItem("login", JSON.stringify(od.login));
    store.setItem("password", JSON.stringify(od.password));
    var isConnected = checkConnection();
    if (!isConnected) {
        offlinemode = true;
//        callback({status: {error: true}, error: "Connection error"});
        loadContent('main', '');

    }
    else {
        offlinemode = false;
        // loadContent('main', '');
    }
    $.post(baseUrl, od, function (result) {

        console.log("Login");
        console.log(result);

        if (result['status'] == "success") {
            loadContent('main', '');
        } else {
            showAlert('The user with that login and password is not found', 'Message');
            //alert("The user with that login and password is not found");
        }

    }, "json");

    event.preventDefault();
});

function loadContent(page, result) {
    if (page === 'login') {
        $('#page').load('content.html #login', function () {

        });
    }
    if (page === 'main') {

        $('#page').load('content.html #main', function () {


            getlocation();
            if (store.getItem("scans") !== null) {
                $("#sendData").show();
            }
            if (offlinemode) {
                $(".titleMode").html("Offline Mode");
                var locations = JSON.parse(store.getItem("locations"));

                for (var i in locations.data) {
                    var obj = locations.data[i];
                    $('#list').append("<option value=" + obj.id + ">" + obj.locations_name + "</option>");
                }
            }
            else {
                $(".titleMode").html("");
            }
            if (scannerAuto) {

                $('#list').val(currlocation);
                $('#btn').hide();
                var input = document.getElementById('guid');
                input.oninput = function () {
                    if ($("#guid").val().length > 5) {
//                        showAlert($("#guid").val().length, 'Message');
                        formSubmit();
                    }
                };
                /*   $("#guid").oninput(function(){
                 
                 });*/
            }

        });
    }
    if (page === 'setting') {
        $('#page').load('content.html #settings_page', function () {
            //  $(document).ready(function () {
            //set initial state.
            if (checked) {
                // 
                document.getElementById("switch").setAttribute("checked", "checked");
            }

            if (offlinemode) {
                // 
                document.getElementById("offlinemode").setAttribute("checked", "checked");
            }
            if (scannerAuto) {
                // 
                document.getElementById("scanner").setAttribute("checked", "checked");
            }



            $('#switch').val($(this).is(':checked'));
            $('#offlinemode').val($(this).is(':checked'));
            $('#scanner').val($(this).is(':checked'));

            $('#switch').change(function () {
                if ($(this).is(":checked")) {
                    checked = true;
                }
                else {
                    checked = false;
                }
            });
            $('#offlinemode').change(function () {
                if ($(this).is(":checked")) {
                    offlinemode = true;
                }
                else {
                    offlinemode = false;
                }
            });
            $('#scanner').change(function () {
                if ($(this).is(":checked")) {
                    scannerAuto = true;
                }
                else {
                    scannerAuto = false;
                }
            });
            // });
        });
    }
    if (page === 'location_history') {
        $('#page').load('content.html #location_history', function () {
            for (var i in result.data) {
                var obj = result.data[i];
                var num_loc = '';
                switch (obj.num_locations.length) {

                    case 1:
                        num_loc = "00" + obj.num_locations;
                        break;
                    case 2:
                        num_loc = "0" + obj.num_locations;
                        break;
                    case 3:
                        num_loc = obj.num_locations;
                        break;
                }
                $(".content_data").append("<div class=\"cd\"><p>" + num_loc + "  " + obj.locations_name + "</p></div>");
            }
            var button = "<button class=\"reject\" onclick=\"loadContent('main','')\">Back</button>";
            $(".content").append("<div id=\"buttons\">" + button + "</div>");

        });
    }
}

function formSubmit() {
//    alert("form submit start");
    var select = $('select[name=list]').val();
    if (select == '0') {
        showAlert('Please select location', 'Message');
        //alert("Please select location");
        return false;
    }

    var id = $('input[name=guid]').val();
    currlocation = id;
    if (id.length == 0) {
        showAlert('Please scan the code', 'Message');
        //alert("Please scan the code");
        return false;
    }
    var isConn = checkConnection();
//    alert (isConn);
    if (!isConn) {
//        showAlert('no connection', 'Message');
//        alert(isConn);
        offlinemode = true;
        $(".titleMode").html("Offline Mode");
    }



    var od = {};
    od.guid = id;
    od.location_id = select;
    od.login = login;
    od.password = password;
    if (offlinemode) {
        od.mode = "1";
        od.date = getTime();
        var result = {guid: od.guid, location_id: od.location_id, date: od.date};
        scans.push(result);
        store.setItem("scans", JSON.stringify(scans));
        setTimeout(function () {
            clean();
        }, 1000);

        if (store.getItem("scans").length > 0) {
            $("#sendData").css({'display': 'inline'});
        }
        return false;
    }
    $.post(baseUrl, od, function (result) {

        console.log("Submit");
        console.log(result);
        setTimeout(function () {
            cordova.plugins.Keyboard.close();
        }, 1000)
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
                    var finalytime = year + "/" + month + "/" + day + "-" + hours + ":" + minutes;
                    time = ("<p id='scan-time'>Last scanned: " + finalytime + "</p><a onclick=\"moreinfo('" + obj.guid + "')\">More info</a>");
                }
                break;
        }


        if (result.status_user !== "1") {
            userData = "<p>" + obj.firstname + " " + obj.lastname + "</p><p>" + obj.guid + "</p>";
        }
        $('.content').html("<div class=\"content_data\">" + userData + "" + time + "<div id=\"moreInfo\"><ul id=\"moreinfolist\"></ul></div></div>" + "<div id=\"buttons\">" + button + "</div>");
    }, "json");
}
function checkConnection() {
    try {
        if (typeof (navigator.connection) === 'undefined') {
            return true;  // is browser
        }
        var networkState = navigator.connection.type;

        var states = {};
        states[Connection.UNKNOWN] = 'Unknown connection';
        states[Connection.ETHERNET] = 'Ethernet connection';
        states[Connection.WIFI] = 'WiFi connection';
        states[Connection.CELL_2G] = 'Cell 2G connection';
        states[Connection.CELL_3G] = 'Cell 3G connection';
        states[Connection.CELL_4G] = 'Cell 4G connection';
        states[Connection.CELL] = 'Cell generic connection';
        states[Connection.NONE] = 'No network connection';

        if (networkState === Connection.NONE) {
            return false;
        }
        return true;

    } catch (error) {
        console.log(error.message);
    }
}
function getlocation() {
    var od = {};
    od.locations = "get";
    od.login = login;
    od.password = password;
    $.post(baseUrl, od, function (result) {

        console.log("Location");
        console.log(result);
        store.setItem("locations", JSON.stringify(result));
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
    od.login = login;
    od.password = password;
    var obj = {date: od.date, guid: od.guid, reject: 0, location_id: od.location_id};
    var isConnected = checkConnection();
    if (!isConnected) {
//        callback({status: {error: true}, error: "Connection error"});
        store.setItem("accept", JSON.stringify(obj));
        return false;
    }
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
    od.login = login;
    od.password = password;
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
    if (checked) {
        scanBarcode();
    }

    $(".content").hide(100);
    $("#submitform").show(100);
    if (scannerAuto) {
        $('#guid').focus();
        var focused = $('#guid'); //this is just to have a starting point
        $('#guid').trigger('touchstart');
        $('#guid').on('touchstart', function () {
            $(this).focus();
            focused = $(this);
        });
        /* $('#guid').trigger('touchstart');
         
         $('#guid').on('touchstart', function () {
         $(this).focus();
         focused = $(this);
         });
         */
    }
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
    if (checked) {
        formSubmit();
    }
//     $('#ContentPlaceHolder1_gvProductList_DXSE_I').val(slipNumber);

}
function gethistory() {
    var od = {};
    od.history = "get";
    od.login = login;
    od.password = password;
    $.post(baseUrl, od, function (result) {
        console.log(result);
        if (result.status == "success") {
            loadContent("location_history", result);

        }
        else {
            showAlert('History is empty', 'Message');
        }


    }, "json");
}
function moreinfo(guid) {
    if (!moreinfostatus) {
        var od = {};
        od.user_history = "get";
        od.guid = guid;
        od.login = login;
        od.password = password;
        $.post(baseUrl, od, function (result) {
            console.log(result);
            $("#moreinfolist").css({'display': 'block'});
            var status = "";

            for (var i in result.data) {
                var obj = result.data[i];
                if (obj.status == 1) {
                    status = "red";
                }
                else {
                    status = "black";
                }
                var obj = result.data[i];
                var date = new Date();
                date.setTime(obj.date);
                var day = date.getDate();
                if (day / 10 < 1) {
                    day = "0" + day;
                }

                var month = date.getUTCMonth() + 1;
                if (month / 10 < 1) {
                    month = "0" + month;
                }

                var year = date.getFullYear();
                var hours = date.getHours();
                var minutes = date.getMinutes();
                $("#moreinfolist").append("<li class=" + status + ">" + year + "/" + month + "/" + day + "  " + hours + ":" + minutes + "  " + obj.locations_name + "</li>");

            }


        }, "json");
        moreinfostatus = true;
    }
    else {
        $("#moreinfolist").hide(100);
        moreinfostatus = false;
    }
}
function uploadData() {
    var data = {};
    data.id = "send";
    data.data = store.getItem("scans");
    data.login = JSON.parse(store.getItem("login"));
    data.password = JSON.parse(store.getItem("password"));
    navigator.notification.confirm(
            'Are you sure to clear the offline scans?', // message
            send(data), // callback to invoke with index of button pressed
            'Message', // title
            'Yes,No'          // buttonLabels
            );

    function send(data) {
        $.post(baseUrl, data, function (result) {
            console.log(result);
            if (result.message == "Error login")
            {
                loadContent('login');
            }
            if (result.status == "success") {

                store.removeItem("scans");
                loadContent('main');
            }


        }, "json");
    }
}
/**/
function isAutoMode(input) {
    if (input.value.length > 5) {

    }
}