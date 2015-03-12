var express = require('express');
var router = express.Router();

var isclient = require('../lib/InfusionsoftApiClient');
var rbmJSONResponse = require("../lib/rbmJSONResponse")

/* GET home page. */
router.get('/', function (req, res, next) {
    var response = {
        success: true,
        data: 'You are running NodeJS, this is the 2MDirect Project. I HAVE UDAPTED THE CODE.',
        error: null
    }; 
  res.render('index', { title: response.data, error: response.error });
});


router.get('/junk', function (req, res, next) {

    var contact = req.body;
    isclient.Caller("my122", "ContactService.update", [843, {ContactNotes:contact}], function(error,value){

        if(error || !contact){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            res.json(rbmJSONResponse.successResponse(value));
        }
    })

});


module.exports = router;
