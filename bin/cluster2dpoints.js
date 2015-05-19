/**
 * Created by Akshay on 4/19/2015.
 */

var kmeans = require('node-kmeans');

var vPoint = require('./VisObject.js').VisPoint;
var vCluster = require('./VisObject.js').VisCluster;
var props;
var xMin = 0, xMax = 0, yMin = 0, yMax = 0;

exports.getCoordRanges = function(){ return [xMin,xMax, yMin, yMax]; }

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

exports.getAllData = function(fileData, prop, callback){
    props = prop;
    var lines = fileData.toString().split('\r\n');
    if(lines.length <3)
        lines = fileData.toString().split('\n');
    var vectors = [];

    for (var i = 0; i < lines.length - 1; i++) {
        var d = lines[i].split('\t');
        vectors[i] = [parseFloat(d[0]), parseFloat(d[1])];
    }

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

    callback(L0);
}

exports.cluster2dpoints = function (L0, prop, zoom, clusterCallback) {
    props=prop;
    if(L0.length > props.maxCentroidsPerView) {

        //console.log("Going to start clustering on " + JSON.stringify(L0) + " num of points" + L0.length);

        var L = []; //Array with elements as lists at different levels (top is 0)

        var vectors = L0.map(function (currentVal) {
            return [currentVal.x, currentVal.y];
        })

        var centroidList = [];
        var Lnew = [];
        getCentroidList(vectors, function (centroidL) {
            centroidList = centroidL;
            Lnew = getNextLevelData(L0, centroidList, zoom);

            if (Lnew != null) {
                L.push(Lnew);
            }

            clusterCallback(L);
        });
    } else {
        clusterCallback([L0]);
    }
};


function getNextLevelData(vObjectList, centroidList, zoomLevel) {

    var result = [];
    var idCounter = 0;
    var maxClusterX = xMin;
    var maxClusterY = yMin;
    var minClusterX = xMax;
    var minClusterY = yMax;

    //console.log("xmin "+ xMin + " "+ xMax + " "+ yMin+" "+yMax);

    var scaledVectors = vObjectList.map(function (currentVal) {
        return [(1000 * zoomLevel * (currentVal.x - xMin) / (xMax - xMin)),
            (1000 * zoomLevel * (currentVal.y - yMin) / (yMax - yMin))]
    });

    //scaledAndSnappedToGridCentroids! hell yeah!
    var scaledCentroids = centroidList.map(function (currentVal) {
        var x = (1000 * zoomLevel * (currentVal[0] - xMin) / (xMax - xMin));
        var y=  (1000 * zoomLevel * (currentVal[1] - yMin) / (yMax - yMin));
        return [Math.round( x/(props.clusteringScaledRadius*2))*2*props.clusteringScaledRadius ,
            Math.round( y/(props.clusteringScaledRadius*2))*2*props.clusteringScaledRadius];
    });

    var fullClusteredPointsList = [];

    //hard stuff, don't change if it is working
    var pointTaken = new Array(scaledVectors.length);
    for(var i=0; i<pointTaken.length; i++)
        pointTaken[i]=0;

    for (var i = 0; i < scaledCentroids.length; i++) {
        //use binary search here if this becomes a bottleneck
        var pointCount = 0;
        var pointIdList = [];
        maxClusterX = xMin;
        maxClusterY = yMin;
        minClusterX = xMax;
        minClusterY = yMax;

        for (var j = 0; j < scaledVectors.length; j++) {
            if (pointTaken[j] != 1) {
                //if (Math.sqrt(Math.pow(scaledVectors[j][0] - scaledCentroids[i][0], 2) +
                //                Math.pow(scaledVectors[j][1] - scaledCentroids[i][1], 2))
                //                < props.clusteringScaledRadius) {
                if(Math.abs(scaledVectors[j][0]-scaledCentroids[i][0]) < props.clusteringScaledRadius &&
                    Math.abs(scaledVectors[j][1]-scaledCentroids[i][1]) < props.clusteringScaledRadius){
                    pointCount++;
                    pointIdList.push(j);
                    if(vObjectList[j].x > maxClusterX)
                        maxClusterX = vObjectList[j].x;
                    if(vObjectList[j].x < minClusterX)
                        minClusterX =vObjectList[j].x;
                    if(vObjectList[j].y > maxClusterY)
                        maxClusterY = vObjectList[j].y;
                    if(vObjectList[j].y < minClusterY)
                        minClusterY = vObjectList[j].y;
                }
            }
        }
        if (pointCount > props.clusteringNumOfPointsThreshold) {
            //console.log("A cluster got made at level " + zoomLevel + "with extremes" + maxClusterX + " " + minClusterX +
           // " "+ maxClusterY + " " +minClusterY);
            var clus = Object.create(vCluster);
            clus.x = minClusterX;
            clus.y = minClusterY;
            clus.xs = maxClusterX - minClusterX;
            clus.ys = maxClusterY - minClusterY;

            clus.id = zoomLevel *100000 +idCounter;
            idCounter++;
            clus.level = zoomLevel;
            clus.lLevelIdList = pointIdList;
            clus.size = pointCount;
            fullClusteredPointsList = fullClusteredPointsList.concat(pointIdList);
            result.push(clus);

            for (var j = 0; j < pointIdList.length; j++) {
                pointTaken[pointIdList[j]] = 1;
            }
        }
    }

    fullClusteredPointsList.sort(function (a, b) {
        return a > b ? 1 : -1;
    });

    for (var i = 0; i < scaledVectors.length; i++) {
        //if(fullClusteredPointsList.binaryIndexOf(i) == -1){
        if (fullClusteredPointsList.indexOf(i) == -1) {
            var point = Object.create(vPoint);
            point.x = vObjectList[i].x;
            point.y = vObjectList[i].y;
            point.id = i;

            result.push(point);
        }
    }

    return result;

};

exports.getView = function (vObjectList, zoomLevel, center, callback) {

    var view = [];


    var scaledVectors = vObjectList.map(function (currentVal) {
        if(currentVal.size ==1) {
            return [(1000 * zoomLevel * (currentVal.x - xMin) / (xMax - xMin)),
                (1000 * zoomLevel * (currentVal.y - yMin) / (yMax - yMin))];
        } else {
            return [(1000 * zoomLevel * (currentVal.x - xMin) / (xMax - xMin)),
                (1000 * zoomLevel * (currentVal.y - yMin) / (yMax - yMin)),
                (1000 * zoomLevel * currentVal.xs / (xMax - xMin)),
                (1000 * zoomLevel * currentVal.ys  / (yMax - yMin))];
        }
    });

    for (var i = 0; i < vObjectList.length; i++) {
        if(vObjectList[i].size >1){
            view[i] = {
                'id': i, 'x': scaledVectors[i][0], 'y': scaledVectors[i][1],
                'c': vObjectList[i].color, 'size': vObjectList[i].size,
                'xs': scaledVectors[i][2], 'ys':scaledVectors[i][3]
            };
        } else {
            view[i] = {
                'id': i, 'x': scaledVectors[i][0], 'y': scaledVectors[i][1],
                'c': vObjectList[i].color, 'size': vObjectList[i].size
            };
        }
    }

    callback(view);
}

function getCentroidList(vectors, getCentroidListCallback) {

    var centroidList = [];
    kmeans.clusterize(vectors, {k: props.maxCentroidsPerView}, function (err, res) {
        if (err) console.error(err);
        else {

            //sorting result by cluster sizes so that bigger clusters later get
            // higher probability of getting in the view
            //res.sort(function (a, b) {
            //    return a.cluster.length > b.cluster.length ? -1 : 1;
            //});

            for (var i = 0; i < res.length; i++) {
                centroidList.push(res[i].centroid);
            }

            getCentroidListCallback(centroidList);
        }
    });

};


