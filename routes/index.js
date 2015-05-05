var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Visliu :',
                        title2: 'Responsive Visualization of Points in Space: Sampling, Clustering, Partitioning'});
});

module.exports = router;
