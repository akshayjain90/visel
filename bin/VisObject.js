/**
 * Created by Akshay on 4/28/2015.
 */

props = require('./props.js').props;
exports.VisPoint = {
    'x': 0.0,
    'y': 0.0,
    'id': 0,
    'level': 0,
    'isCluster': 'F',
    'uLevelId': 0,
    'lLevelId': 0,
    'color': props.pointColor,
    'attributes': {},
    'size': 1
}

exports.VisCluster = {
    'x': 0.0,
    'y': 0.0,
    'id': 0,
    'level': 1,
    'isCluster': 'T',
    'uLevelId': 0,
    'lLevelIdList': [0, 1], //list of ids
    'color': props.clusterColor,
    'attributes': {},
    'size': 2
}

