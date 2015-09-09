/**
 * Created by richardbrash on 9/4/15.
 */


var express = require('express');
var isclient = require('../lib/InfusionsoftApiClient');
var url = require('url');

var rbmJSONResponse = require("../lib/rbmJSONResponse");

var router = express.Router();

router.param('appname', function(req, res, next, appname){

    req.appname = appname;
    next();

});

router.param('cid', function(req, res, next, cid){

    req.cid = parseInt(cid);
    next();

});

router.get("/owners/:appanme/:cid", function(req,res){

    res.json(rbmJSONResponse.successResponse([
        {name:"Tom Davis", email:"tom@davis.com"},
        {name:"Ricard Brash", email:"richard@brash.com"},
        {name:"Eli Brash", email:"eli@brash.com"},
        {name:"Mickey Mouse", email:"mickey@mouse.com"},
    ]));

});

router.get("/contact/:appname/:cid", function(req,res){

    isclient.Caller(req.appname, "DataService.load", ["Contact", req.cid,["FirstName", "LastName", "Email", "CompanyID"]], function(error, user){

        if(error || !user){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            res.json(rbmJSONResponse.successResponse(user));
        }
    });

})

router.get("/:appname/:cid", function(req,res){

    var query = {};

    query["_OwnerCID"] = req.cid;



    isclient.Caller(req.appname, "DataService.query", ["Lead", 1, 0, query,[
        "OpportunityTitle",
        "ContactID",
        "Id",
        "StageID",
        "NextActionDate",
        "DateCreated",
        "_OwnerName",
        "_OwnerEmail",
    ]
    ], function(error, data){

        if(error || !data){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            res.json(rbmJSONResponse.successResponse(data));
        }
    });

});




module.exports = router;
