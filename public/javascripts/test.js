
var Blob = require('blob');

function blobToImage(imageData) {
    if (Blob && 'undefined' != typeof URL) {
        var blob = new Blob([imageData], {type: 'image/jpeg'});
        return URL.createObjectURL(blob);
    } else if (imageData.base64) {
        return 'data:image/jpeg;base64,' + imageData.data;
    } else {
        return 'about:blank';
    }
}

$( function() {
    var socket = io();
    var state = "0";
    var data = "Hello";

    var fileSelected ="";
    //Instead of at a interval, do this at every user action
    setInterval(getDataFromServer,5000);

    function fillOptions(){
        socket.emit('getDataFiles');

        var options = $('#options');
        options.append($("<p />",{"text":"Select a data file"}));
        options.append($("<select />",{"id":"fileSelect"}));
        options.append($("<button />", {"id":"loadData","text":"Load Data","value":"Load Data"}));
        socket.on('dataFiles',function(msg){
            var fileNameList= msg.split(" ");

            for(var fileName in fileNameList)
            {
                $('#fileSelect').append($("<option />", {"text":fileNameList[fileName], "value":fileNameList[fileName]}));
            }
        });

        $('#loadData').click(function(){
           socket.emit('selectDataFile',$( "#fileSelect option:selected" ).text());
        });

    }
    fillOptions();

    function getDataFromServer(){
        socket.emit('state',state);
    }

    socket.on('InitData', function(msg){
        data = msg;
        console.log("loaded data: " + JSON.stringify(data));
    });

    socket.on('newData', function(msg){
       console.log("Recieved new data from server " + msg);
        updateData(msg);
    });

    function updateData(updateObj){
        p = updateObj.split(" ");

    };


    function viz(processing){

        var width = 1000;
        var height = 1000;
        var margin = 40;
        processing.setup = function(){
            processing.size(width,height);
            processing.background('#A5E4E8');
            processing.frameRate(20);
        }


        processing.draw = function(){


            processing.strokeWeight(1);
            processing.stroke(20,20,20);
            processing.background(230,230,230);
            processing.line(margin, height - margin, margin, margin); //vertical line
            processing.line(margin, height - margin, width - margin, height - margin); //horizontal line
            processing.fill(0);

            processing.strokeWeight(1);
            processing.stroke(20,20,20);
            for(var i=0;i<data.length; i++ )
            {
                if(data[i].size == 1) {
                    processing.fill(255,0,0);
                    processing.ellipse(data[i].x * 0.7 + 200, data[i].y * 0.7 + 200, 5, 5);
                }else {
                    processing.fill(0,255,0);
                    processing.ellipse(data[i].x * 0.7 + 200, data[i].y * 0.7 + 200, 20, 20);
                }
            }

        };
    }

    var canvas1 = document.getElementById("canvas1");
    var processingInstance1 = new Processing(canvas1, viz);



    function netD(processing){

        //Use this line in production. It does not take the port
        var image1Addr = 'http://'+window.location.host +'/images/902kb.jpg';
        var size1 = 902;

        var networkSpeedData1 = [];
        var networkSpeedData2 = [];
        var counter =0;
        var width = 1300;
        var height = 500;

        processing.setup = function(){
            processing.size(width,height);
            processing.background('#A5E4E8');
            processing.frameRate(1);


        }


        processing.draw = function(){

            var startTime, endTime, speedInKB;
            var startTime1, endTime1, speedInKB1;

            function getResults(startTime, endTime, networkSpeedData){
                var duration = (endTime - startTime) / 1000;
                speedInKB = (size1 / duration).toFixed(2);
                networkSpeedData.push(speedInKB);
            }


            //frameRate cannot be set to less than 1, using this if loop to update only every 5 seconds
            if(counter == 0){


                function redrawNetGraph() {
                    //draw the grid

                    var margin = 60; // using this variable both for margin and step size

                    processing.strokeWeight(1);
                    processing.stroke(20,20,20);
                    processing.background(230,230,230);
                    processing.line(margin, height - margin, margin, margin); //vertical line
                    processing.line(margin, height - margin, width - margin, height - margin); //horizontal line
                    processing.fill(0);
                    //updateGraph
                    var min = Math.min.apply(null, networkSpeedData1),
                        max = Math.max.apply(null, networkSpeedData1);
                    var rangeFactor = (max-min)/margin;
                    var numHorizontalTicks = Math.round((width - margin-1)/margin);

                    //processing.pushMatrix();
                    //processing.translate(10, 30);
                    //processing.rotate(Processing.PI/2.0);
                    processing.text("(MBps)",10, 50);
                    //processing.popMatrix();

                    for (var i = margin; i < height - margin; i += margin) {
                        processing.line(margin - 4, height - i, margin + 4, height - i); //vertical tick marks

                        processing.text(Math.round(((i+2*margin)*rangeFactor+min)/1000), margin -30 , height-i );
                    }

                    for (var i = margin; i < width - margin-1; i += margin) {
                        processing.line( margin + i ,height - margin -4, margin + i, height - margin + 4); //horizontal tick marks

                        processing.text(  i/margin +1 -networkSpeedData1.length , margin +i , height - margin +30 );

                    }


                    processing.stroke(230, 0, 0);


                    for (var i = 1; i < networkSpeedData1.length; i++) {
                        processing.line( margin + (i - 1)*margin ,  height-2*margin- (networkSpeedData1[i - 1]- min)/rangeFactor,
                             margin + i*margin, height - 2* margin -(networkSpeedData1[i]- min)/rangeFactor);  //Network speed graph
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
                    getResults(startTime,endTime,networkSpeedData1);
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

    var  networkData= document.getElementById("networkData");
    var processingInstance2 = new Processing(networkData,netD );

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

