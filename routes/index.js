var express = require('express');
var router = express.Router();

var rbmJSONResponse = require("../lib/rbmJSONResponse");

/* GET home page. */
router.get('/', function(req, res, next) {
    res.json(rbmJSONResponse.successResponse({message:"You are running NodeJS, this is the 2MDirect Project."}));
});

module.exports = router;
