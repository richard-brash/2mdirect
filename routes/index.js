var express = require('express');

var isclient = require('../lib/InfusionsoftApiClient');
var rbmJSONResponse = require("../lib/rbmJSONResponse");

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

router.get('/junk', function(req,res){

    isclient.Caller("cj105", "DataService.query", ["Lead",1000,0,{StageID:335, ContactID:432751},
        ["Id", "ContactID", "UserID","StageID", "_ContractStart", "_ContractEnd", "OpportunityTitle","OpportunityNotes"]], function(error, data){

        if(error){
            res.json(rbmJSONResponse.errorResponse(error));
        } else {
            res.json(rbmJSONResponse.successResponse(data));
        }

    });


})



module.exports = router;
