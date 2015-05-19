$(function () {
    var socket = io();

    var state = {"zoom":1,"xDisp":0,"yDisp":0,"levelsOnClient":[1]};
    var data = [];
    var allData =[];
    var fileSelected = "";
    var coordRanges = [0,1000,0,1000];
    var clusterSide = 20;

    //event handling
    var mousePressed = 0;
    var mouseMoved = 0;
    var areaSelected = 0;
    var mouseDownAtX = 0;
    var mouseDownAtY = 0;
    var zoomCenterX = 0;
    var zoomCenterY = 0;
    var space = false;
    var zoomBy = 10;

    function setEmpty(){
        var v=[];
        for(var i=0; i<100;i++){
            v.push([]);
        }
        return v;
    }
    var selectedData = setEmpty() ;

    var specialColors =setEmpty();

    var margin = 40;
    var panOrSelect = 0; //0 for pan, 1 for select
    var mx = 0, my = 0;

    var clientVersion =0;
    var serverVersion =0;

    function fillOptions2(){

        //$('#options21').append($("<p />", {"text": "Upload a new data file:"}));
        //$('#options22').append($("<form />",{"id":"fileUploadForm", "action":"/", "method":"post"}));
        //$("#fileUploadForm").append("<input />", {"id":"fileUploadInput", "type": "file", "name":"uploadedDataFile","class":"file", "data-show-preview":"false"});
        //$("#fileUploadInput").fileinput();


        $('#options24').append($("<input />",{"id":"panOrSelect", "type":"checkbox", "name":"panOrSelect",
            "data-on-text":"Select", "data-off-text":"Pan","data-off-color":"success",
            "data-label-text":"Pan/Select"}));
        $("[name='panOrSelect']").bootstrapSwitch();

        $('input[name="panOrSelect"]').on('switchChange.bootstrapSwitch', function(event, state) {
                if(state == true)
                    panOrSelect=1;
                else
                    panOrSelect=0;
        });


        $('#options26').append($("<p />", {"text":"Zoom Sensitivity:"}));
        $('#options27').append($("<select />",{"id":"zoomBy","class":"form-control"}));

        var zoomValues = ["10%","20%","30%","40%","50%","60%","70%","80%","90%","100%"];

        var zoomList = $("#zoomBy")
        for(var i=0;i<zoomValues.length; i++){
            zoomList.append($("<option />",{"text":zoomValues[i] }));
        }

        zoomList.change(function () {
            zoomBy = parseInt($("#zoomBy option:selected").text());
        })

        $('#options29').append($("<button />", {"id": "cancelSelection", "text": "Cancel Selection",
            "value": "Cancel selection","class":"btn btn-default"}));


    }
    fillOptions2();


    function fillOptions() {
        socket.emit('getDataFiles');

        var options = $('#options');
        options.append($("<p />", {"text": "Select a data file"}));
        options.append($("<select />", {"id": "fileSelect","class":"form-control"}));
        options.append($("<br />"));
        options.append($("<button />", {"id": "loadData", "text": "Load Data", "value": "Load Data","class":"btn btn-default"}));

        socket.on('dataFiles', function (msg) {
            var fileNameList = msg.split(" ");

            for (var fileName in fileNameList) {
                $('#fileSelect').append($("<option />", {
                    "text": fileNameList[fileName]
                }));
            }
        });

        $('#loadData').click(function () {
            selectedData = setEmpty();
            state.levelsOnClient= [1];
            state.zoom =1;
            state.xDisp=0;
            state.yDisp=0;

            socket.emit('selectDataFile', $("#fileSelect option:selected").text());
        });

        options.append($("<br />"));
        options.append($("<br />"));


        //options.append($("<p />", {"text": "Select points by id list:"}));
        //options.append($("<input />", {"id": "selectPointsById", "type": "text", value: ""}));
        //options.append($("<button />", {"id": "makeSelection", "text": "Make Selection", "value": "Make selection"}));




        options.append($("<br />"));
        options.append($("<p />", {"text": "Select one or more points to perform these operations :"}));
        options.append($("<br />"));
        options.append($("<br />"));


        options.append($("<div />", {"id": "operationsList"}));
        options.append($("<br />"));


        var operations = options.children("#operationsList");
        operations.append($("<p />", {"text": "Translate points:"}));
        operations.append($("<input />", {"id": "transX", "type": "text", placeholder: "x translation","class":"form-control"}));
        operations.append($("<input />", {"id": "transY", "type": "text", placeholder: "y translation","class":"form-control"}));
        operations.append($("<br />"));
        operations.append($("<button />", {"id": "translate", "text": "Translate", "value": "Translate","class":"btn btn-default"}));

        operations.append($("<br />"));
        operations.append($("<br />"));
        operations.append($("<br />"));

        operations.append($("<p />", {"text": "Change Color:"}));
        operations.append($("<input />", {"id": "newColor", "class":"color","onchange": "changePointColors(this.color)" }));
        //operations.append($("<button />", {"id": "recolorPoints", "text": "Recolor", "value": "Recolor"}));

        operations.append($("<br />"));
        operations.append($("<br />"));
        operations.append($("<br />"));
        operations.append($("<p />", {"text": "Delete Points :", 'id':'dpp'}));
        operations.append($("<button />", {"id": "deletePoints", "text": "Delete", "value": "Delete","class":"btn btn-default"}));

        operations.append($("<br />"));
        operations.append($("<br />"));
        operations.append($("<p />", {"text": "Add Points: ", 'id':'app'}));
        operations.append($("<textarea />", {
            "rows": 20,
            "cols": 20,
            "id": "newPointsArea",
            "type": "text",
            "placeholder": "34567.6  ,  567.3",
            "class":"form-control"
        }));
        operations.append($("<button />", {"id": "addPoints", "text": "Add", "value": "Add","class":"btn btn-default"}));

    }
    fillOptions();

    function updateServerParameters() {
        var paramObject = {};
        $("#parameters").children("input").each(function (index) {
            paramObject[$(this).attr("class")] = $(this).val();
        });
        socket.emit('updateParameters', paramObject);
    }

    socket.on('parameters', function (msg) {
        var mousePos = $('#mousePos');
        mousePos.append($("<p />", {"id": "mouseLocX"}));
        mousePos.append($("<p />", {"id": "mouseLocY"}));

        var params = $('#parameters');
        if (params.children().length) {
            for (var prop in msg) {
                params.find("input." + prop).eq(0).attr("text", msg[prop]);
            }
        } else {
            for (var prop in msg) {
                params.append($("<p />", {"class": prop, "text": prop}));
                params.append($("<input />", {"class": prop, "type": "text", "value": msg[prop]}));
                params.append($("<br />"));
            }
            params.append($("<button />", {
                "id": "updateParamButton",
                "text": "Update Parameter",
                "value": "Update Parameter"
            }));
            $("#updateParamButton").on("click", updateServerParameters);
        }
    });
    socket.emit('getParameters');

    setInterval(unhideHideOperations, 1000);
    function unhideHideOperations(){
        var operations = $("#operationsList");

        if(selectedData[1].length ==0) {
            operations.find('input, textarea, button, select').not('#addPoints').not('#newPointsArea').each(function () {
                $(this).prop('disabled', true);
            });
            operations.find('p').not('#app').each(function () {
                $(this).css('opacity', 0.5);
            });


        } else {
            operations.find('input, textarea, button, select').each(function () {
                $(this).prop('disabled', false);
            });
            operations.find('p').each(function () {
                $(this).css('opacity',1);
                $(this).css('font-weight', 'bold' );
            });
        }
    }

    setInterval(getDataFromServer, 10000);
    function getDataFromServer() {
       // if(serverVersion < clientVersion) {
            socket.emit('state', state);
            serverVersion +=1;
        //}
    };
    //clientVersion+=1;


    socket.on('InitData', function (msg) {
        data[1] = msg.data;
        coordRanges = msg.coordRanges;
        //getDataFromServer();
    });

    socket.on('newData', function (msg) {
        console.log("Recieved new data from server : " + JSON.stringify(msg));
        serverVersion = msg.version;
        updateData(msg);
    });

    function updateData(updateObj) {

        data[updateObj.level]= updateObj.data;
        state.levelsOnClient.push(updateObj.level);
    };


    function viz(processing) {

        var width = 1080;
        var height = 1080;


        processing.setup = function () {
            processing.size(width, height);
            processing.background('#A5E4E8');
            processing.frameRate(20);
        }


        processing.draw = function () {


            processing.strokeWeight(1);
            processing.stroke(20, 20, 20);

            processing.background(230, 230, 230);
            processing.line(margin, height - margin, margin, margin);
            processing.line(width - margin, height - margin, width - margin, margin);
            processing.line(margin, height - margin, width - margin, height - margin);
            processing.line(margin, margin, width - margin, margin);
            processing.fill(0);

            for (var i = margin; i <= height-margin ; i += 10) {
                if((i-margin) %100 ==0) {
                    processing.line(2, i,  6, i);
                    var temp = Math.round( (coordRanges[3] -coordRanges[2])/1000 *(i-margin));
                    if(temp > 9999)
                        temp = Math.round(temp/1000) + "K";
                    processing.text(temp ,  1, i-5);
                } else {
                    processing.line(2, i,  4, i);
                }
            }

            processing.fill(140,100);
            processing.quad(margin,  margin+ (-1)*state.yDisp/state.zoom , margin,margin + (-1*state.yDisp+1000)/state.zoom,
                0, margin + (-1*state.yDisp+1000)/state.zoom, 0, margin+ (-1)*state.yDisp/state.zoom );


            processing.fill(0);
            for (var i = margin; i <= width-margin ; i += 10) {
                if((i-margin) %100 ==0) {
                    processing.line(i, 4,  i, 8);
                    var temp = Math.round( (coordRanges[1] -coordRanges[0])/1000 *(i-margin));
                    if(temp > 9999)
                        temp = Math.round(temp/1000) + "K";
                    processing.text(temp ,  i-15, 25);
                } else {
                    processing.line( i, 4,i, 6);
                }
            }

            processing.fill(140,100);
            processing.quad(margin+ (-1)*state.xDisp/state.zoom, margin,  margin + (-1 *state.xDisp+1000)/state.zoom,
                margin, margin + (-1 *state.xDisp+1000)/state.zoom, 0, margin+ (-1)*state.xDisp/state.zoom,0 );


            processing.strokeWeight(1);
            processing.stroke(50);
            //processing.noStroke();
            var coorX ;
            var coorY ;
            var alpha;

            for (var i = 1; i < data.length && i<= state.zoom ; i++) {
                for(var j =0;data[i] && j<data[i].length ;j++) {
                    //coorX = allData[state.zoom][i].x + margin + state.xDisp;
                    //coorY = allData[state.zoom][i].y + margin + state.yDisp;
                    //console.log(state.zoom);
                    coorX = data[i][j].x * state.zoom   + margin + state.xDisp;
                    coorY = data[i][j].y * state.zoom  + margin + state.yDisp;

                    if(!('deleted' in data[i][j]) || ('deleted' in data[i][j] && data[i][j].deleted == false)) {
                        if (coorX > 0 && coorX < 1000 && coorY > 0 && coorY < 1000) {

                            alpha = 30;

                            if ((coorX > margin && coorX < 1000 + margin) && (coorY > margin && coorY < 1000 + margin)) {
                                alpha = 200;
                            }

                            if (data[i][j].size == 1) {

                                if (specialColors[i] && specialColors[i][j]) {
                                    processing.fill(specialColors[i][j][0], specialColors[i][j][1],
                                        specialColors[i][j][2], alpha);
                                } else {
                                    processing.fill(250, 0, 0, alpha);
                                    //if(i==2)
                                    //    processing.fill(0, 250, 0, alpha);
                                }

                                if (selectedData[i] && selectedData[i][j]) {
                                    processing.ellipse(coorX, coorY, 8, 8);
                                } else {
                                    processing.ellipse(coorX, coorY, 5, 5);
                                }
                            } else {
                                //console.log(data[i][j]);
                                if (specialColors[i] && specialColors[i][j]) {
                                    processing.fill(specialColors[i][j][0], specialColors[i][j][1],
                                        specialColors[i][j][2], alpha + 50 - alpha * (state.zoom - i) / 2);
                                } else {
                                    processing.fill(200, 0, 0, alpha + 50 - alpha * (state.zoom - i) / 2);
                                    //if(i==2)
                                    //  processing.fill(0, 250, 0, alpha);

                                }


                                if (selectedData[i] && selectedData[i][j]) {
                                    processing.rect(coorX //- data[i][j].xs * ( state.zoom - i) / 2 - 5
                                        , coorY //- data[i][j].ys * (state.zoom - i) / 2 - 5
                                        , data[i][j].xs * (1 + state.zoom - i) + 10, data[i][j].ys * (1 + state.zoom - i) + 10);
                                } else {
                                    processing.rect(coorX //- data[i][j].xs * ( state.zoom - i) / 2
                                        , coorY  // - data[i][j].ys * ( state.zoom - i) / 2
                                        , data[i][j].xs * (1 + state.zoom - i), data[i][j].ys * (1 + state.zoom - i));
                                }

                                if (i < Math.floor(state.zoom) + 1) {
                                    processing.fill(0, alpha + 100 - alpha * (state.zoom - i) / 4);
                                    processing.textSize(5 * (state.zoom - i + 1));
                                    processing.text("size: " + data[i][j].size, coorX + 10 + 2 * (state.zoom - i + 1), coorY + 20 + 2 * (state.zoom - i + 1));
                                }

                            }
                        }
                    }
                }
            }

            if(mousePressed && mouseMoved ) {
                if (panOrSelect) {
                    processing.fill(0, 0, 200, 50);
                    processing.rect(mouseDownAtX, mouseDownAtY, mx - mouseDownAtX, my - mouseDownAtY);
                }
            }

        };
    }

    var canvas1 = document.getElementById("canvas1");
    var processingInstance1 = new Processing(canvas1, viz);



    function windowToCanvas(canvas, x, y) {
        var bbox = canvas.getBoundingClientRect();

        return {
            x: x - bbox.left * (canvas.width / bbox.width),
            y: y - bbox.top * (canvas.height / bbox.height)
        };
    }

    canvas1.onmousemove = function (e) {
        var loc = windowToCanvas(canvas1, e.clientX, e.clientY);
        updateReadout(loc.x, loc.y);

        if (mousePressed == 1) {
            mouseMoved = 1;
            if (panOrSelect) {
                areaSelected = 1;
                mx = loc.x;
                my = loc.y;
            } else {
                mx = loc.x;
                my = loc.y;

                if(Math.abs(mouseDownAtX-mx)>2  ){
                    state.xDisp += getXDisplacement(mx-mouseDownAtX);
                    mouseDownAtX = mx;
                }
                if(Math.abs(mouseDownAtY-my)>2  ){
                    state.yDisp += getYDisplacement(my-mouseDownAtY);
                    mouseDownAtY = my;
                }
            }
        }
    };

    function selectDataForOperations(mouseDownAtX, mouseDownAtY, x, y){
        var temp;
        if(mouseDownAtX > x){
            temp = mouseDownAtX;
            mouseDownAtX = x;
            x= temp;
        }
        if(mouseDownAtY > y){
            temp = mouseDownAtY;
            mouseDownAtY = y;
            y= temp;
        }

        for (var i = 1; i < data.length; i++) {
            for(var j=0 ;j<data[i].length; j++) {
                if (data[i][j].x * state.zoom + margin + state.xDisp > mouseDownAtX &&
                    data[i][j].x * state.zoom + margin + state.xDisp < x &&
                    data[i][j].y * state.zoom + margin + state.yDisp > mouseDownAtY &&
                    data[i][j].y * state.zoom + margin + state.yDisp < y)
                    selectedData[i][j] = 1;
            }
        }
    }


    $('#translate').click(function(){
        clientVersion +=1;
        var transX = Number($('#transX').val());
        var transY = Number($('#transY').val());
        if(!isNaN(transX) && !isNaN(transY)) {
            for (var i = 1; i < data.length; i++) {
                for(var j=0; j<data[i].length; j++) {
                    if (selectedData[i][j]) {

                        data[i][j].x += transX * 1000 * state.zoom / (coordRanges[1] - coordRanges[0]);
                        data[i][j].y += transY * 1000 * state.zoom / (coordRanges[3] - coordRanges[2]);
                    }
                }
            }
        }


    });

    $('#deletePoints').click(function(){
        clientVersion +=1;
        for (var i = 1; i < data.length; i++) {
            for(var j=0; j<data[i].length; j++) {
                if (selectedData[i][j]) {

                    data[i][j].deleted = true;
                }
            }
        }
        selectedData = setEmpty();
    })

    $('#addPoints').click(function(){
        clientVersion +=1;
        if($('#newPointsArea').val() ) {
            var text= $('#newPointsArea').val();

            var lines = text.split('\r\n');
            if(lines.indexOf('\n')!=-1)
                lines = text.split('\n');

            console.log(JSON.stringify(lines));
            var newPoint ={};
            for (var i = 0; i < lines.length ; i++) {
                var d = lines[i].split(',');
                newPoint= {'x':parseFloat(d[0]), 'y': parseFloat(d[1]), 'id': data[1].length,'size':1};
                console.log(JSON.stringify(newPoint));
                data[1].push(newPoint);
            }
        }
    })

    //Need to define with window because jscolor executes it in an outer namespace
    window.changePointColors = function(color){
        for (var i = 1; i < data.length; i++) {
            for(var j=0 ; j<data[i].length; j++ ) {
                if (selectedData[i][j]) {

                    specialColors[i][j] = [color.rgb[0] * 255, color.rgb[1] * 255, color.rgb[2] * 255];
                }
            }
        }
    };

    /*$('#recolorPoints').click(function(){
        clientVersion +=1;
        console.log($('#newColor').get().rgb);
        /*for (var i = 0; i < data.length; i++) {
            if(selectedData[i]){
                specialColors[i] = #('#newColor')
            }
        }

    })*/

    $('#cancelSelection').click(function(){
        selectedData = setEmpty();
    })

    canvas1.onmousedown = function (e) {
        var loc = windowToCanvas(canvas1, e.clientX, e.clientY);
        mousePressed = 1;
        mouseDownAtX = loc.x;
        mouseDownAtY = loc.y;

        if (panOrSelect) {

        } else {

        }
    };

    canvas1.onmouseup = function (e) {
        var loc = windowToCanvas(canvas1, e.clientX, e.clientY);
        mousePressed = 0;

        if (mouseMoved) {
            if (panOrSelect) {
                selectDataForOperations(mouseDownAtX, mouseDownAtY, loc.x, loc.y);
            } else {

            }
        } else {
            areaSelected =0;
        }
    };

    function zoomIn(x,y,amount) {
        amount = amount * zoomBy * 0.01 * state.zoom;
        //if(state.zoom + amount < allData.length-1) {
            state.zoom += amount ;
            state.xDisp -= x * amount ;
            state.yDisp -= y * amount ;
            console.log("zooming in");
        //}
    }

    function zoomOut(x, y ,amount){
        amount = amount * zoomBy * 0.01 * state.zoom;

        if(state.zoom - amount <1)
            amount = state.zoom -1;

        if(amount > 0) {
            state.zoom -= amount;
            state.xDisp += getXDisplacement((1000-x)*amount);
            state.yDisp += getYDisplacement((1000-y)*amount);
            console.log("zooming out");
        }
    }

    var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
    $('#canvas1').bind( mousewheelevt, function (e){
        e.preventDefault();

        var evt = window.event || e; //equalize event object
        evt = evt.originalEvent ? evt.originalEvent : evt; //convert to originalEvent if possible
        var delta = evt.detail ? evt.detail*(-40) : evt.wheelDelta; //check for detail first, because it is used by Opera and FF

        var loc = windowToCanvas(canvas1, e.clientX, e.clientY);
        if (delta > 0) {
            zoomIn(loc.x, loc.y, 1);
        } else {
            zoomOut(loc.x, loc.y, 1);
        }

    });

    /*
    canvas1.onmousewheel = function(e) {
       // if(space) {
            e.preventDefault();
            var loc = windowToCanvas(canvas1, e.clientX, e.clientY);
            if (e.wheelDelta > 0) {
                zoomIn(loc.x, loc.y, 1);
            } else {
                zoomOut(loc.x, loc.y, 1);
            }
       // }
    }

*/

    $(document).keyup(function(evt) {
        if (evt.keyCode == 32) {
            space = false;
        }
    }).keydown(function(evt) {
        if (evt.keyCode == 32) {
            space = true;
        }
    });


    function getXDisplacement(xdisp){

        if (state.xDisp + xdisp > 0) {
            return -1 *state.xDisp;
        } else {
            if (-1 * ( state.xDisp + xdisp) > 1000 * (state.zoom - 1))
                return -1 * state.xDisp -1000 * (state.zoom - 1);
            else
                return xdisp;
        }
    }

    function getYDisplacement(ydisp){

        if (state.yDisp + ydisp > 0) {
            return -1 *state.yDisp;
        } else {
            if (-1 * ( state.yDisp + ydisp) > 1000 * (state.zoom - 1))
                return -1 * state.yDisp -1000 * (state.zoom - 1);
            else
                return ydisp;
        }
    }


    function updateReadout(x, y) {
        $('#mouseLocX').text(x);
        $('#mouseLocY').text(panOrSelect);
    }


    function netD(processing) {

        //Use this line in production. It does not take the port
        var image1Addr = 'http://' + window.location.host + '/images/902kb.jpg';
        var size1 = 902;

        var networkSpeedData1 = [];
        var networkSpeedData2 = [];
        var counter = 0;
        var width = 1300;
        var height = 500;

        processing.setup = function () {
            processing.size(width, height);
            processing.background('#A5E4E8');
            processing.frameRate(1);


        }


        processing.draw = function () {

            var startTime, endTime, speedInKB;
            var startTime1, endTime1, speedInKB1;

            function getResults(startTime, endTime, networkSpeedData) {
                var duration = (endTime - startTime) / 1000;
                speedInKB = (size1 / duration).toFixed(2);
                networkSpeedData.push(speedInKB);
            }


            //frameRate cannot be set to less than 1, using this if loop to update only every 5 seconds
            if (counter == 0) {


                function redrawNetGraph() {
                    //draw the grid

                    var margin = 60; // using this variable both for margin and step size

                    processing.strokeWeight(1);
                    processing.stroke(20, 20, 20);
                    processing.background(230, 230, 230);
                    processing.line(margin, height - margin, margin, margin); //vertical line
                    processing.line(margin, height - margin, width - margin, height - margin); //horizontal line
                    processing.fill(0);
                    //updateGraph
                    var min = Math.min.apply(null, networkSpeedData1),
                        max = Math.max.apply(null, networkSpeedData1);
                    var rangeFactor = (max - min) / margin;
                    var numHorizontalTicks = Math.round((width - margin - 1) / margin);

                    //processing.pushMatrix();
                    //processing.translate(10, 30);
                    //processing.rotate(Processing.PI/2.0);
                    processing.text("(MBps)", 10, 50);
                    //processing.popMatrix();

                    for (var i = margin; i < height - margin; i += margin) {
                        processing.line(margin - 4, height - i, margin + 4, height - i); //vertical tick marks

                        processing.text(Math.round(((i + 2 * margin) * rangeFactor + min) / 1000), margin - 30, height - i);
                    }

                    for (var i = margin; i < width - margin - 1; i += margin) {
                        processing.line(margin + i, height - margin - 4, margin + i, height - margin + 4); //horizontal tick marks

                        processing.text(i / margin + 1 - networkSpeedData1.length, margin + i, height - margin + 30);

                    }


                    processing.stroke(230, 0, 0);


                    for (var i = 1; i < networkSpeedData1.length; i++) {
                        processing.line(margin + (i - 1) * margin, height - 2 * margin - (networkSpeedData1[i - 1] - min) / rangeFactor,
                            margin + i * margin, height - 2 * margin - (networkSpeedData1[i] - min) / rangeFactor);  //Network speed graph
                    }
                    //console.log("net speed array: " +networkSpeedData1);

                    /**
                     processing.stroke(0, 230, 0);

                     for (var i = 1; i < networkSpeedData2.length; i++) {
                        processing.line( margin + (i - 1)*margin ,  height-2*margin- (networkSpeedData2[i - 1]- min)/rangeFactor,
                            margin + i*margin, height - 2* margin -(networkSpeedData2[i]- min)/rangeFactor);  //Network speed graph
                    }
                     console.log("net speed array: " +networkSpeedData2); **/

                }


                //Normal image loading
                var image1 = new Image();
                image1.onload = function () {
                    endTime = (new Date()).getTime();
                    getResults(startTime, endTime, networkSpeedData1);
                    redrawNetGraph();
                }

                startTime = (new Date()).getTime();
                var cacheBuster = "?nnn=" + startTime;
                image1.src = image1Addr + cacheBuster;

                /**
                 //Image loading using WebSockets
                 startTime1 =  (new Date()).getTime();
                 io.emit('getNetDImage');
                 io.on('NetDImage',function(frame){
                    console.log(frame);
                    var src = blobToImage(frame.image);
                    if (!src) return;

                    var img = new Image();
                    img.src = src;
                    img.onload = function(){
                    endTime1 =  (new Date()).getTime();
                    getResults(startTime1,endTime1,networkSpeedData2);
                    redrawNetGraph();
                }}); **/


            }

            counter = (++counter) % 10;


        };
    }

   // var networkData = document.getElementById("networkData");
   // var processingInstance2 = new Processing(networkData, netD);

    /*
     function dataOnClient(processing){

     processing.setup = function(){

     }


     processing.draw = function(){



     };
     }

     var dataOnClient = document.getElementById("dataOnClient");
     var processingInstance3= new Processing(dataOnClient,dataOnClient );


     function processorUsed(processing){

     processing.setup = function(){

     }


     processing.draw = function(){



     };
     }

     var processorUsed = document.getElementById("processorUsed");
     var processingInstance4 = new Processing(processorUsed,processorUsed );
     */
});

