
function loadData() {

    var $form = $("#tlist");
    var select = $form.find('select[name=list]');
    if (select.val() == '0') {
        alert("Please select location");
        return false;
    }
    var $form = $("#idlist");
    var id = $form.find('input[name=guid]').val();

    if (id.length == 0) {
        alert("Please input the code");
        return false;
    }

//   var select=form.find("select[name=list]").val();
    var od = {};

    od.guid = id;
    //"0EBC4833-A4D7-E883-A69D-1DA42A11C570";
    od.location_id = select.val();
    $.post("http://coladaservices.de/test_icans26/api/scannerApi.php", od, function (result) {
        //alert( "success" );
        console.log(result);
        var obj = result.data;
        var button = "";

        if (result.status_user === "1") {
            alert("Wrong GUID");

            return false;
        } else {
            $("#submitform").hide(100);
            $("#content").show(100);
            switch (result.status_user) {
                case "1":
                    button = "<div id=\"buttons\"><div>User guid not found</div><br><button >Cancel</button></div>";
                    break;
                case "2":
                    button = "<div id=\"buttons\"><button class=\"accept_on\" onclick=\"accept('" + obj.guid + "','" + od.location_id + "')\">Accept</button></div>";
                    break;
                case "3":
                    button = "<div id=\"buttons\"><button class=\"accept\" onclick=\"accept('" + obj.guid + "','" + od.location_id + "')\">Accept</button><button class=\"reject\" onclick=\"Reject('" + obj.guid + "','" + od.location_id + "')\">Reject</button></div>";
                    break;
            }
            var time = "";
//        <button class=\"acept\">Acept</button><button class=\"reject\>Reject</button>
            if (result.scanned_data) {
                var date = new Date();
                date.setTime(result.scanned_data.date);
                var day = date.getDate();
                var month = date.getUTCMonth() + 1;
                var year = date.getFullYear();
                var hours = date.getHours();
                var minutes = date.getMinutes();
                var finalytime = year + ":" + month + ":" + day + "-" + hours + ":" + minutes;
                time = ("<br>Last scanned: " + finalytime);
            }
// seconds part from the timestamp
//        var seconds =  date.getSeconds();

// will display time in 10:30:23 format
            //var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
            $('#content').html("<div class=\"divs\">" + obj.firstname + " " + obj.lastname + "<br><br>" + obj.guid + "" + time + "</div>" + "<div id=\"b\">" + button + "</div>");
            //obj.nametitle + "<br>" +  + "<br>" + obj.guid + "<br>"+time"</div>"+
        }
    }, "json");
}
function getlocation() {
    var od = {};
    od.locations = "get";
    $.post("http://coladaservices.de/test_icans26/api/scannerApi.php", od, function (result) {
        //alert( "success" );
        console.log(result);


        for (i in result.data) {
            var obj = result.data[i];
            $('#list').append("<option value=" + obj.id + ">" + obj.locations_name + "</option>");
        }


        // $('#content').append(obj.nametitle+"<br>"+obj.lastname+"<br>"+obj.firstname+"<br>"+obj.guid+"<br>"+obj.regcancelled+"<br><button>Acept</button><button onclick=\"Reject('"+obj.guid+"')\">Reject</button>");
    }, "json");
}
function accept(guid, location_id) {
    $("#content").hide(100);
    $("#submitform").show(100);
    $('input[name=guid]').val("");
    alert("succsses");
    var date = new Date();
    var time = date.getTime();
    var od = {};
    od.date = time;
    od.guid = guid;
    od.reject = 0;
    od.location_id = location_id;
    $.post("http://coladaservices.de/test_icans26/api/scannerApi.php", od, function (result) {
        //alert( "success" );
        console.log(result);
        //  var obj=result.data;

        //  $('#content').append(obj.nametitle+"<br>"+obj.lastname+"<br>"+obj.firstname+"<br><button>Acept</button><button onclick=\"Reject()\">Reject</button>");
    }, "json");
}
function Reject(guid, location_id) {
    $("#content").hide(100);
    $("#submitform").show(100);
    $('input[name=guid]').val("");
    var od = {};
    od.reject = 1;
    od.guid = guid;
    od.location_id = location_id;
    $.post("http://coladaservices.de/test_icans26/api/scannerApi.php", od, function (result) {
        //alert( "success" );
        console.log(result);
        //  var obj=result.data;

        //  $('#content').append(obj.nametitle+"<br>"+obj.lastname+"<br>"+obj.firstname+"<br><button>Acept</button><button onclick=\"Reject()\">Reject</button>");
    }, "json");
}