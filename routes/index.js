var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Visliu :',
                        title2: 'Responsive Visualization of Points in Space: Sampling, Clustering, Partitioning',
                        instructions: "1. Select a data file and click on load data." +
                        "\x3C br /> 2. To zoom, either" +
                        "   a. Keep the mouse over the canvas and scroll using the wheel on a mouse or " +
                        "       a two finger vertical swipe on a touchpad. " +
                        "or" +
                        "   b. Keep the mouse over the canvas and press E to zoom in or D to zoom out." +
                        "3. To Pan, either" +
                        "   a. Mouse down anywhere on the canvas and drag" +
                        "or" +
                        "   b. Use A to pan left, W to pan up, Z to pan down and S to pan right" +
                        "4. To perform operations on data, first click the Pan/Select switch in the header menu to Select state" +
                        "and then do mouse down and drag. The selected objects will get highlighted. Multiple selects get added to the" +
                        "same selection until the Cancel Selection button in the header menu is pressed." +
                        "5. To change global visualization configuration, use the button on top right.",
                       });
});

module.exports = router;
