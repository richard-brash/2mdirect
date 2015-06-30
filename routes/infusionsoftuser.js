/**
 * Created by richardbrash on 5/11/15.
 */


var express = require('express');
var isclient = require('../lib/InfusionsoftApiClient');
var url = require('url');

var rbmJSONResponse = require("../lib/rbmJSONResponse");

var router = express.Router();

router.param('appName', function(req, res, next, appName){

    req.appName = appName;
    next();

});

router.param('userid', function(req, res, next, userid){

    req.userid = parseInt(userid);
    next();

});


router.get("/:appName/:userid", function(req,res){

    isclient.Caller(req.appName, "DataService.load", ["User", req.userid,["FirstName", "LastName",]], function(error, user){

        if(error || !user){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            res.json(rbmJSONResponse.successResponse(user));
        }
    });

});

module.exports = router;
