var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    var response = {
        success: true,
        data: 'You are running NodeJS, this is the 2MDirect Project. I HAVE UDAPTED THE CODE.',
        error: null
    }; 
  res.render('index', { title: response.data, error: response.error });
});

module.exports = router;
