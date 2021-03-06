var scan = {
    slipObjectsArray: []
};
var login = '';
var password = '';
var offlinemode = false;
var scans = [];
var isBarcode = false;
var autoMode = false;
var currlocation = '';
var delay = 10;
var lastValue = 0;
var code_lenght = 6;
var timeOutVar = null;
var cameraOn = true;
var store = window.localStorage;
var isMobile = false;
var count = 0;
var isConnected;
var uploadStatus = 0;
var menu = 0;

if (document.URL.indexOf("http://") === -1 && document.URL.indexOf("https://") === -1) {
    isMobile = true;
}

$(document).ready(function () {
    document.addEventListener("deviceready", onDeviceReady, false);
    loadContent('login', '');

});

function keyboardShowHandler() {
    if (menu === 1) {
        $('.bottom-menu').hide();
    }
    window.scrollTo(0, 100);
}
function keyboardHideHandler() {
    if (menu === 1) {
        setTimeout(function () {
            $('.bottom-menu').slideDown();
        }, 600);
    }
}

function onDeviceReady() {
    if (device.model.indexOf("iPod") !== -1) {
        cameraOn = false;
    }
    StatusBar.styleDefault();
    // StatusBar.overlaysWebView(false);
    setInterval(function () {
        isConnected = checkConnection();
        if (!isConnected) {
            offlinemode = true;
            $(".titleMode").text("Offline Mode");
            $('#get-history').css('color', '#9E9E9F');
        } else {
            offlinemode = false;
            $(".titleMode").text("");
            $('#get-history').css('color', '#000');
            if ((store.getItem("scans") !== null) && (uploadStatus === 0)) {
                uploadStatus = 1;
                uploadData();
            }
        }
    }, 1000);

    screen.lockOrientation('portrait');
    StatusBar.overlaysWebView(false);
    window.addEventListener('native.keyboardshow', keyboardShowHandler);
    window.addEventListener('native.keyboardhide', keyboardHideHandler);
}

var baseUrl = "https://www.seera.de/scanner-api/index.php";
//var baseUrl = "http://server/3/scanner-api/index.php";

$(document).on('submit', '#login-form', function () {
    login = $('input[name=login]').val();
    password = $('input[name=password]').val();

    if (login.length == '0') {
        showAlert('Please enter login details', 'Info:');
        //alert("Please input login");
        return false;
    }

    if (password.length == 0) {
        showAlert('Please enter password details', 'Info:');
        //alert("Please input password");
        return false;
    }

    if (offlinemode) {
        showAlert('You are not connected to the Internet', 'Info:');
        return false;
    }

    var od = {};
    od.login = login;
    od.password = password;

    store.setItem("login", JSON.stringify(od.login));
    store.setItem("password", JSON.stringify(od.password));
    store.setItem("remember", JSON.stringify($('#rem-me').is(':checked')));


    $.post(baseUrl, od, function (result) {

        console.log("Login");
        console.log(result);

        if (result['status'] == "success") {
            loadContent('main', '');
        } else {
            showAlert('The user with that login and password is not found', 'Error:');
            //alert("The user with that login and password is not found");
        }

    }, "json");

    event.preventDefault();
});

$(document).on('change', '#list', function () {
    currLoc = $("#list").val();
    if (($("#guid").val().length) > 2 && ($("#list").val() != 0)) {
        formSubmit();
    }
});

$(document).on('click', '.qr-button', function (e) {
    if ($('.qr-button').hasClass('disabled')) {
        return false;
    }

    if (autoMode) {
        $('.qr-button').addClass('disabled');
    }
    scanBarcode();
    e.preventDefault();
});

$(document).on('input', '#guid', function () {
    if (count == 0) {
        keyboardShowHandler();
    }
    if (($("#guid").val().length > 2) && ($("#guid").val().length - lastValue > 1)) {
        lastValue = $("#guid").val().length;
        formSubmit();
    } else {
        lastValue = $("#guid").val().length;
    }
});

function loadContent(page, result) {
    if (page === 'login') {
        $('#page').load('content.html #login', function () {
            if (store.getItem('remember') == 'true') {
                $('input[name=login]').val(JSON.parse(store.getItem('login')));
                $('input[name=password]').val(JSON.parse(store.getItem('password')));
                $('input[name=remember_me]').attr('checked', 'checked');
            }
        });
        menu = 0;
    } else {
        menu = 1;
    }
    if (menu === 0) {
        $('.bottom-menu').slideUp();
    } else {
        $('.bottom-menu').slideDown();
    }
    count++;

    if (page === 'main') {
        count = 0;

        $('#page').load('content.html #main', function () {
            if (typeof result !== 'undefined') {
                $('#guid').val(result);


            }
            if (!cameraOn) {
                $('.qr').remove();
            }

            getlocation();

            if (offlinemode) {
                $(".titleMode").text("Offline Mode");
                var locations = JSON.parse(store.getItem("locations"));

                for (var i in locations.data) {
                    var obj = locations.data[i];
                    if (currlocation === obj.id) {
                        $('#list').append("<option selected value=" + obj.id + ">" + obj.locations_name + "</option>");
                    }
                    else {
                        $('#list').append("<option value=" + obj.id + ">" + obj.locations_name + "</option>");
                    }
                }

            }
        });
    }
    if (page === 'setting') {
        currlocation = $("#list").val();
        $('#page').load('content.html #settings_page', function () {
            if (autoMode) {
                //
                document.getElementById("switch").setAttribute("checked", "checked");
            }

            if (cameraOn) {
                //
                document.getElementById("cameraOn").setAttribute("checked", "checked");
            }

            $('#cameraOn').val($(this).is(':checked'));
            $('#switch').val($(this).is(':checked'));
            $('#scanner').val($(this).is(':checked'));
            $('#delay').val(delay);
            $('#Code_lenght').val(code_lenght);

            $('#delay').change(function () {
                delay = $('#delay').val();
            });

            $('#switch').change(function () {
                if ($(this).is(":checked")) {
                    autoMode = true;
                    isBarcode = false;
                }
                else {
                    autoMode = false;
                }
            });

            $('#cameraOn').change(function () {
                if ($(this).is(":checked")) {
                    cameraOn = true;
                }
                else {
                    isBarcode = false;
                    cameraOn = false;
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
                $(".content_data").append("<div class=\"cd\"><p class=\"history-by-location-block\">" + num_loc + "  " + obj.locations_name + "</p></div>");
            }
            var button = "<button class=\"button reject-button\" onclick=\"loadContent('main','')\">Back</button>";
            $(".content").append("<div id=\"buttons\">" + button + "</div>");

        });
    }
    if (page === 'info') {
        $('#page').load('content.html #info', function () {

        });
    }
    if (page === 'searchByUsername') {
        $('#page').load('content.html #page-content', function () {
            $('#searchName').submit(function (e) {
                var data = {
                    login: JSON.parse(window.localStorage['login']),
                    password: JSON.parse(window.localStorage['password']),
                    search_name: $("input[name='search_name']").val()
                };
                if (data.search_name.length < 3) {
                    return false;
                }
                $.post(baseUrl, data, function (result) {
                    result = JSON.parse(result);
                    if (result.status == 'success') {
                        var searchNameList = '';
                        var regStatus = '';
                        var regFunction = '';

                        var countElements = result.data.length;
                        for (var i in result.data) {
                            var obj = result.data[i];
                            if (obj.regcomp === '1') {
                                regStatus = 'b-green';
                                regFunction = 'addRegUser';
                            } else {
                                regStatus = 'b-yellow';
                                regFunction = 'addNoRegUser';
                            }
                            obj.company = obj.company ? ', ' + obj.company : '';
                            obj.firstname = obj.firstname ? ', ' + obj.firstname : '';

                            var showItem = i > 4 ? 'none' : 'block';

                            searchNameList += '<div class="search-item" data-id="' + obj.guid + '" style="display:' + showItem + '"><div class="wrapper-table"><div class="s-buttons"><i onclick="' + regFunction +
                                '(\'' + obj.guid + '\')" class="fa fa-plus-circle m-button ' + regStatus + '"></i></div><div class="s-text more-info"><span onclick="' + regFunction +
                                '(\'' + obj.guid + '\')" >' +
                                obj.lastname + obj.firstname + obj.company + '</span></div></div><div class="more-info-data"></div></div>'
                        }
                        var buttonMore = countElements > 5 ? '<div class="more-block"><p class="more-info-button more-button">More items</p></div>' : '';
                        $(".content").html('<div class="content_data margin-block">' + searchNameList + buttonMore + '</div>');
                        var userCounter = 5;
                        $('.more-button').click(function () {
                            var allUsers = document.getElementsByClassName('search-item');
                            for (var i = userCounter; i < userCounter + 5; i++) {

                                if (typeof allUsers[i] !== 'undefined') {
                                    allUsers[i].style.display = 'block';
                                }
                                else {
                                    $('.more-button').css({'display': 'none'});
                                    break;
                                }
                            }
                            userCounter += 5;
                        })
                    } else {
                        $(".content").html('');
                        showAlert('User is not found', '.error-search');
                    }
                });
                //.success(function (result) {
                //    console.log(result)
                //})
                //.error(function (error) {
                //    console.log(error);
                //});
                e.preventDefault();
            })
        });
    }
}
function addRegUser(id) {
    isNotReg = false;
    loadContent('main', id);
}
function addNoRegUser(id) {
    isNotReg = true;
    loadContent('main', id);
}

function formSubmit() {
    if (isMobile) {
        cordova.plugins.Keyboard.close();
    }

    var select = $('select[name=list]').val();
    if (select == '0') {
        showAlert('Please select location', 'Info:');
        return false;
    }

    var id = $('input[name=guid]').val();
    currlocation = $("#list").val();

    if (id.length == 0) {
        showAlert('Please scan the code', 'Info:');
        return false;
    }

    var od = {};
    od.guid = id;
    od.location_id = select;
    od.login = login;
    od.password = password;

    if (offlinemode) {
        accept(od.guid, od.location_id);
        return false;
    }

    window.localStorage.locations = {};
    $.post(baseUrl, od, function (result) {

        console.log("Submit");
        console.log(result);

        var obj = result.data;

        var userData = "";
        var button = "";
        var time = "";

        $("#submitform").hide(0);
        $(".content").show(0);

        switch (result.status_user) {
            case "1":
                userData = "<div>The code is not found</div>";
                button = "<button class=\"button reject-button\" onclick=\"clean()\">Back</button>";
                break;
            case "2":

                button = "<button class=\"submit-button button\" onclick=\"accept('" + obj.guid + "','" + od.location_id + "')\">Accept</button>";
                break;
            case "3":
                button =
                    "<button class=\"submit-button button\" onclick=\"accept('" + obj.guid + "','" + od.location_id + "')\">Accept</button>" +
                    "<button class=\"button reject-button\" onclick=\"reject('" + obj.guid + "','" + od.location_id + "')\">Reject</button>"
                //"<button class=\"submit-button button\" onclick=\"moreinfo('" + obj.guid + "')\">Info</button>";

                if (result.scanned_data) {
                    var date = new Date();
                    date.setTime(result.scanned_data.date);
                    var day = date.getDate();
                    var month = date.getUTCMonth() + 1;
                    var year = date.getFullYear();
                    var hours = date.getHours();
                    var minutes = date.getMinutes();
                    var finalytime = year + "/" + month + "/" + day + "&nbsp;-&nbsp;" + hours + ":" + minutes;
                    time = ("<p id='scan-time'>Last scan: " + finalytime + "</p>");
                }

                break;
        }


        if (result.status_user !== "1") {
            userData = "<p>" + obj.firstname + " " + obj.lastname + "</p><p>" + (obj.jobtitle?obj.jobtitle:'') + "<p>" + (obj.company?obj.company:'') + "</p>" + (obj.scan_notes?obj.scan_notes:'') + "</p><p>" + obj.guid + "</p>";
        }
        if (result.status_user === "2") {
            userData = "<p>" + obj.firstname + " " + obj.lastname + "</p><p>" + (obj.jobtitle?obj.jobtitle:'') + "<p>" + (obj.company?obj.company:'') + "</p>" + (obj.scan_notes?obj.scan_notes:'') + "</p><p>" + obj.guid + "</p>";
        }

        $('.content').html(
            "<div class=\"content-option\">" +
            "<div class=\"content_data\">" + userData + "" + time + "</div>" +
            "<div id=\"buttons\">" + button + "</div>" +
            "</div>" +
            "<div class=\"content-more-info\">" +
            "<div class=\"content_data\"><div id=\"moreInfo\"><ul id=\"moreinfolist\"></ul></div></div>" +
            "<div id=\"buttons\"><button class=\"button reject-button\" onclick=\"backToOption()\">Back</button></div>" +
            "</div>"
        );

        if (timeOutVar) {
            clearTimeout(timeOutVar);
        }
        if (result.status_user === '1') {
            timeOutVar = setTimeout(function () {
                clean();
            }, delay * 1000);
        } else if (result.status_user === '2') {
            //if(!isNotReg){
            timeOutVar = setTimeout(function () {
                accept(obj.guid, od.location_id);
            }, delay * 1000);
            //}
        }


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
            if (currlocation === obj.id) {
                $('#list').append("<option selected value=" + obj.id + ">" + obj.locations_name + "</option>");
            }
            else {
                $('#list').append("<option value=" + obj.id + ">" + obj.locations_name + "</option>");
            }
        }
        if (typeof currLoc !== 'undefined') {
            $('#list').val(currLoc);
        }
    }, "json");
}

function accept(guid, location_id) {
    if (timeOutVar) {
        clearTimeout(timeOutVar);
    }
    var od = {};
    od.date = getTime();
    od.guid = guid;
    od.reject = 0;
    od.location_id = location_id;
    od.login = login;
    od.password = password;
    var obj = {date: od.date, guid: od.guid, reject: 0, location_id: od.location_id};

    if (offlinemode) {
        var result = {guid: od.guid, location_id: od.location_id, date: od.date};
        scans.push(result);
        store.setItem("scans", JSON.stringify(scans));
        setTimeout(function () {
            clean();
        }, 1000);
        return false;
    }

    $.post(baseUrl, od, function (result) {
        console.log("accept");
        console.log(result);

        if (result.status !== "success") {
            showAlert(result.message, 'Error:')
        }
    }, "json");
    clean();
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

        if (result.status !== "success") {
            showAlert(result.message, 'Error:')
        }
    }, "json");
    clean();
}

function getTime() {
    var date = new Date();
    var time = date.getTime();
    return time;
}

function clean() {
    if (timeOutVar) {
        clearTimeout(timeOutVar);
    }
    $(".content").hide(0);
    $("#submitform").show(0);

    if (autoMode) {
        if (isBarcode) {
            setTimeout(function () {
                scanBarcode();
            }, 201);
        } else {
            $('#guid').focus();
        }
    }
    $('input[name=guid]').val("");
    lastValue = 0;
    count = 0;
}

function showAlert(message, title) {
    if (isMobile) {
        navigator.notification.alert(
            message,
            null,
            title,
            'Ok'
        );
    } else {
        alert(message);
    }
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
            //alert('scanning cancelled');
            $('.qr-button').removeClass('disabled');
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
            if (result.cancelled) {
                isBarcode = false;
            }
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
    isBarcode = true;
    $('#guid').val(slipNumber);
    if (autoMode) {
        formSubmit();
    }
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
            showAlert('History is empty', 'Info:');
        }


    }, "json");
}
function searchByUsername() {

    loadContent("searchByUsername");
}

function moreinfo(guid) {
    if (timeOutVar) {
        clearTimeout(timeOutVar);
    }

    var od = {};
    od.user_history = "get";
    od.guid = guid;
    od.login = login;
    od.password = password;

    $.post(baseUrl, od, function (result) {

        console.log(result);
        $('.content-option').fadeOut(200);
        setTimeout(function () {
            $(".content-more-info").fadeIn(200);
        }, 201);

        var status = "";
        var liTmp = "";


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
            if (hours / 10 < 1) {
                hours = "0" + hours;
            }
            var minutes = date.getMinutes();
            if (minutes / 10 < 1) {
                minutes = "0" + minutes;
            }
            liTmp += "<li class=" + status + ">" + year + "/" + month + "/" + day + "  " + hours +
                ":" + minutes + "  " + obj.locations_name + "</li>";

        }
        $("#moreinfolist").append(liTmp);
    }, "json");
}

function uploadData() {
    var data = {};
    data.id = "send";
    data.data = store.getItem("scans");
    data.login = JSON.parse(store.getItem("login"));
    data.password = JSON.parse(store.getItem("password"));

    if (offlinemode) {
        showAlert('You are not connected to the Internet', 'Info:');
        return false;
    }

    $.post(baseUrl, data, function (result) {
        console.log(result);
        if (result.message == "Error login") {
            loadContent('login');
        }
        if (result.status == "success") {
            navigator.notification.alert(
                "Scanned data has been uploaded to the server",
                null,
                "Message",
                'Ok'
            );
            uploadStatus = 0;
            store.removeItem("scans");
            scans = [];
        }


    }, "json");
}

function logout() {
    navigator.notification.confirm('Do you really want to log out?',
        function (button_id) {
            if (button_id == 1) {
                loadContent('login', '')
            }
        },
        'Message',
        ['Yes', 'No']
    );
}

function backToOption() {
    $(".content-more-info").fadeOut(200);
    setTimeout(function () {
        $('.content-option').fadeIn(200);
    }, 201);
}