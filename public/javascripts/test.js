$(function () {
    var socket = io();
    var state = {"zoom":1,"xDisp":0,"yDisp":0};
    var data = "";
    var allData =[];
    var fileSelected = "";

    function fillOptions() {
        socket.emit('getDataFiles');

        var options = $('#options');
        options.append($("<p />", {"text": "Select a data file"}));
        options.append($("<select />", {"id": "fileSelect"}));
        options.append($("<button />", {"id": "loadData", "text": "Load Data", "value": "Load Data"}));
        socket.on('dataFiles', function (msg) {
            var fileNameList = msg.split(" ");

            for (var fileName in fileNameList) {
                $('#fileSelect').append($("<option />", {
                    "text": fileNameList[fileName],
                    "value": fileNameList[fileName]
                }));
            }
        });

        $('#loadData').click(function () {
            socket.emit('selectDataFile', $("#fileSelect option:selected").text());
        });

        options.append($("<br />"));
        options.append($("<br />"));


        options.append($("<p />", {"text": "Select points by id list:"}));
        options.append($("<input />", {"id": "selectPointsById", "type": "text", value: ""}));
        options.append($("<button />", {"id": "makeSelection", "text": "Make Selection", "value": "Make selection"}));

        options.append($("<div />", {"id": "operationsList"}));
        options.append($("<br />"));

        var operations = options.children("#operationsList");

        operations.append($("<br />"));
        operations.append($("<p />", {"text": "Select one or more points to perform these operations :"}));
        operations.append($("<p />", {"text": "Translate:"}));
        operations.append($("<input />", {"id": "transX", "type": "text", value: "x translation"}));
        operations.append($("<input />", {"id": "transY", "type": "text", value: "y translation"}));

        operations.append($("<br />"));
        operations.append($("<p />", {"text": "Recolor (r,g,b,a):"}));
        operations.append($("<input />", {"id": "newColor", "type": "text", value: "(20,20,20,0.5)"}));
        operations.append($("<button />", {"id": "recolorPoints", "text": "Recolor", "value": "Recolor"}));

        operations.append($("<br />"));
        operations.append($("<p />", {"text": "Delete :"}));
        operations.append($("<button />", {"id": "deletePoints", "text": "Delete", "value": "Delete"}));

        operations.append($("<br />"));
        operations.append($("<p />", {"text": "Add Points: "}));
        operations.append($("<textarea />", {
            "rows": 20,
            "cols": 20,
            "id": "newPointsArea",
            "type": "text",
            "value": "34567.6 567.3"
        }));
        operations.append($("<button />", {"id": "addPoints", "text": "Add", "value": "Add"}));
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

    //Instead of at a interval, do this at every user action
    setInterval(getDataFromServer, 5000);

    function getDataFromServer() {
        socket.emit('state', state);
    };
    //getDataFromServer();

    socket.on('InitData', function (msg) {
        data = msg.data;
        allData[1] = data;
        //console.log("loaded data: " + JSON.stringify(data));
    });

    socket.on('newData', function (msg) {
        console.log("Recieved new data from server " + msg);
        updateData(msg);
    });

    function updateData(updateObj) {

        allData[updateObj.level]= updateObj.data;
    };


    function viz(processing) {

        var width = 1080;
        var height = 1080;
        var margin = 40;

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
            //processing.fill(0);

            processing.strokeWeight(1);
            processing.stroke(20, 20, 20);
            //console.log(allData);
            for (var i = 0; i < data.length; i++) {

                if (allData[state.zoom][i].size == 1) {
                    processing.fill(255, 0, 0);
                    processing.ellipse(allData[state.zoom][i].x + margin + state.xDisp , allData[state.zoom][i].y + margin + state.yDisp, 5, 5);
                } else {
                    processing.fill(0, 255, 0);
                    processing.ellipse(allData[state.zoom][i].x + margin + state.xDisp , allData[state.zoom][i].y + margin + state.yDisp, 20, 20);
                }
            }

            if(mousePressed && mouseMoved ) {
                if (panOrSelect) {
                    processing.fill(0, 0, 200, 50);
                    processing.rect(mouseDownAtX, mouseDownAtY, mx - mouseDownAtX, my - mouseDownAtY);
                } else {


                }

            }

        };
    }

    var canvas1 = document.getElementById("canvas1");
    var processingInstance1 = new Processing(canvas1, viz);


    //event handling
    var mousePressed = 0;
    var mouseMoved = 0;
    var areaSelected = 0;
    var mouseDownAtX = 0;
    var mouseDownAtY = 0;
    var zoomCenterX = 0;
    var zoomCenterY = 0;

    var panOrSelect = 0; //0 for pan, 1 for select
    var mx = 0, my = 0;

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
                    state.xDisp += getXDisplacement(mx-mouseDownAtX)
                    mouseDownAtX = mx;
                }
                if(Math.abs(mouseDownAtY-my)>2  ){
                    state.xDisp += getYDisplacement(my-mouseDownAtY)
                    mouseDownAtY = my;
                }
            }
        }
    };

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
        if(state.zoom + amount < allData.length-1) {
            state.zoom += amount;

            state.xDisp -= x * amount;
            state.yDisp -= y * amount;

            console.log("zooming in");
        }
    }

    function zoomOut(x, y ,amount){
        if(state.zoom -amount >0) {
            state.zoom -= amount;
            if (state.xDisp + x * amount > 0) {
                state.xDisp = 0;
            } else {
                if (-1 * ( state.xDisp + x * amount) > 1000 * (state.zoom - amount - 1))
                    state.xDisp = -1000 * (state.zoom - amount - 1)
                else
                    state.xDisp += x * amount;

            }
            if (state.yDisp + y * amount > 0 ){
                state.yDisp = 0;
            } else {
                if (-1 * ( state.yDisp + y * amount) > 1000 * (state.zoom - amount - 1))
                    state.yDisp = -1000 * (state.zoom - amount - 1)
                else
                    state.yDisp += y * amount;
            }


            console.log("zooming out");
        }
    }

    canvas1.onmousewheel = function(e) {
        e.preventDefault();
        var loc = windowToCanvas(canvas1, e.clientX, e.clientY);
        if(e.wheelDelta >0){
            zoomIn(loc.x,loc.y,1);
        } else {
            zoomOut(loc.x,loc.y,1);
        }
    }

    canvas1.onkeypress = function(e) {
        var left =37,up=38, right=39, down=40, pageUp =33, pageDown =34;


        if(e.keyCode == pageUp ) {
            zoomIn(0, 0, 1);
        }
        if(e.keyCode == pageDown) {
            zoomOut(0,0,1);
        }

    }

    function getXDisplacement(xdisp){

        if (state.xDisp + xdisp > 0) {
            return -1 *state.xDisp;
        } else {
            if (-1 * ( state.xDisp + xdisp) > 1000 * (state.zoom - 1))
                return -1 * state.xDisp -1000 * (state.zoom - 1)
            else
                return xdisp;

        }
    }


    function updateReadout(x, y) {
        $('#mouseLocX').text(x);
        $('#mouseLocY').text(y);
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

    var networkData = document.getElementById("networkData");
    var processingInstance2 = new Processing(networkData, netD);

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

