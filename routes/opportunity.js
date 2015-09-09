/**
 * Created by richardbrash on 8/31/15.
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

router.param('stageid', function(req, res, next, stageid){

    req.stageid = parseInt(stageid);
    next();

});

router.get("/:appname/:cid", function(req,res){

    var query = {};

    query["ContactID"] = req.cid;

    isclient.Caller(req.appname, "DataService.query", ["Lead", 1, 0, query,[
            "OpportunityTitle",
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

router.get("/byid/:appname/:cid", function(req,res){

    var query = {};

    query["ContactID"] = req.cid;

    isclient.Caller(req.appname, "DataService.load", ["Lead", req.cid,[
        "OpportunityTitle",
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

router.get("/stage/:appname/:stageid", function(req,res){

    isclient.Caller(req.appname, "DataService.load", ["Stage", req.stageid,["StageName",]], function(error, data){

        if(error || !data){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            res.json(rbmJSONResponse.successResponse(data));
        }
    });

});


module.exports = router;
