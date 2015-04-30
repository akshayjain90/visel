/**
 * Created by Akshay on 4/19/2015.
 */

var kmeans = require('node-kmeans');
var props = require('./props.js').props;
var vPoint = require('./VisObject.js').VisPoint;
var vCluster = require('./VisObject.js').VisCluster;
var xMin=0, xMax=0, yMin=0, yMax=0;

function binaryIndexOf(searchElement) {

    var minIndex = 0;
    var maxIndex = this.length - 1;
    var currentIndex;
    var currentElement;

    while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = this[currentIndex];

        if (currentElement < searchElement) {
            minIndex = currentIndex + 1;
        }
        else if (currentElement > searchElement) {
            maxIndex = currentIndex - 1;
        }
        else {
            return currentIndex;
        }
    }

    return -1;
}
Array.prototype.binaryIndexOf = binaryIndexOf;

exports.cluster2dpoints = function (fileData , clusterCallback) {

    var lines = fileData.toString().split('\r\n');
    var vectors = [];

    for (var i = 0; i < lines.length - 1; i++) {
        var d = lines[i].split('\t');
        vectors[i] = [parseFloat(d[0]), parseFloat(d[1])];
    }

    var L = []; //Array with elements as lists at different levels (top is 0)

    var L0 = [];
    vectors.sort(function (a, b) {
        return a[0] > b[0] ? 1 : -1;
    });

    xMin = vectors.reduce(function (min, vec) {
        return vec[0] < min ? vec[0] : min;
    }, Infinity),
    xMax = vectors.reduce(function (max, vec) {
        return vec[0] > max ? vec[0] : max;
    }, Number.NEGATIVE_INFINITY),
    yMin = vectors.reduce(function (min, vec) {
        return vec[1] < min ? vec[1] : min;
    }, Infinity),
    yMax = vectors.reduce(function (max, vec) {
        return vec[1] > max ? vec[1] : max;
    }, Number.NEGATIVE_INFINITY);


    for (var i = 0; i < vectors.length; i++) {
        var point = Object.create(vPoint);
        point.id = i;
        point.x = vectors[i][0];
        point.y = vectors[i][1];
        L0.push(point);
    }

    var centroidList;
    var Lnew;
    getCentroidList(vectors, function(centroidL) {
        centroidList = centroidL;
        Lnew = getNextLevelData(L0,centroidList, 1 );

        if(Lnew !=null) {
            L.push(Lnew);
        }

        clusterCallback(L);


    });


};

function getCentroidListCallback(centroidList){

}

function getNextLevelData(vObjectList, centroidList, zoomLevel) {

    var result = [];
    var idCounter =0;

    var scaledVectors = vObjectList.map(function (currentVal) {
        return [(1000 * zoomLevel* (currentVal.x - xMin) / (xMax - xMin)),
            (1000 * zoomLevel * (currentVal.y - yMin) / (yMax - yMin))]
    });

    var scaledCentroids = centroidList.map(function (currentVal) {
        return [(1000 * zoomLevel* (currentVal[0] - xMin) / (xMax - xMin)),
            (1000 * zoomLevel* (currentVal[1] - yMin) / (yMax - yMin))]
    });

    var fullClusteredPointsList =[];
    //hard stuff, don't change if it is working

    /*
    var xSortedScaledVectors = scaledVectors.sort(function (a, b) {
        return a.x > b.x ? 1 : -1;
    });

    var xSortedScaledVectors = scaledVectors.sort(function (a, b) {
        return a.y > b.y ? 1 : -1;
    });
    */

    for(var i=0; i< scaledCentroids.length; i++){
    //use binary search here if this becomes a bottleneck
        var pointCount=0;
        var pointIdList = [];
        for(var j=0; j<scaledVectors.length; j++){
            if(Math.abs(Math.sqrt(Math.pow(scaledVectors[j][0] -scaledCentroids[i][0],2) +Math.pow(scaledVectors[j][1] -scaledCentroids[i][1],2)) < props.clusteringScaledRadius)){
                pointCount++;
                pointIdList.push(j);
            }
        }
        if(pointCount  >  props.clusteringNumOfPointsThreshold){
            console.log("A cluster got made at level "+zoomLevel);
            var clus = Object.create(vCluster);
            clus.x = centroidList[i][0];
            clus.y = centroidList[i][1];
            clus.id = idCounter;
            idCounter++;
            clus.level = zoomLevel;
            clus.lLevelIdList = pointIdList;
            clus.size= pointCount;
            fullClusteredPointsList = fullClusteredPointsList.concat(pointIdList);
            result.push(clus);
        }
    }

    fullClusteredPointsList.sort(function (a, b) {
        return a[0] > b[0] ? 1 : -1;
    });

    for(var i=0;i<scaledVectors.length; i++){
        if(fullClusteredPointsList.binaryIndexOf(i) == -1){
            var point = vObjectList[i];
            point.id = idCounter;
            idCounter++;
            result.push(point);
        }
    }

    console.log("vobjectlist "+vObjectList);
    console.log("result "+result);
    console.log("centroids "+ centroidList);

    if (result.length == vObjectList.length ) {
        return result;
    } else {
        return result;
    }
};

exports.getView= function(vObjectList,zoomLevel) {
    var view = [];

    var scaledVectors = vObjectList.map(function (currentVal) {
        return [(1000 * zoomLevel* (currentVal.x - xMin) / (xMax - xMin)),
            (1000 * zoomLevel * (currentVal.y - yMin) / (yMax - yMin))]
    });

    for(var i=0; i<vObjectList.length; i++){
        view[i] = {'x':scaledVectors[i][0], 'y':scaledVectors[i][1], 'c':vObjectList[i].color, 'size': vObjectList[i].size};
    }


    return view
}

function getCentroidList(vectors, getCentroidListCallback) {

    var centroidList = [];
    kmeans.clusterize(vectors, {k: props.maxCentroidsPerView}, function (err, res) {
        if (err) console.error(err);
        else {
            console.log("res " +res);
            for (var i = 0; i < res.length; i++) {
                centroidList.push(res[i].centroid);
            }
            getCentroidListCallback(centroidList);
        }
    });

    //console.log("centroidList" +centroidList);
    //return centroidList;
};


