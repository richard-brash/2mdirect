/**
 * Created by richardbrash on 8/31/15.
 */


var express = require('express');
var isclient = require('../lib/InfusionsoftApiClient');
var url = require('url');
var Config = require('../config');

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

router.get("/afteractionul/:appname", function(req,res){

    var afterActionURL = Config.ISConfig(req.appname).afterActionURL;
    res.json({afterActionURL:afterActionURL});

})

router.get("/:appname/:cid", function(req,res){

    var query = {};

    query["ContactID"] = req.cid;

    isclient.Caller(req.appname, "DataService.query", ["Lead", 1, 0, query,[
            "OpportunityTitle",
            "Id",
            "StageID",
            "NextActionDate",
            "NextActionNotes",
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
        "NextActionNotes",
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

router.get("/contact/:appname/:cid", function(req,res){

    var customFields = Config.ISConfig(req.appname).customFields;

    var askFields =         [
        "Id",
        "Company",
        "FirstName",
        "LastName",
        "Email",
        "JobTitle",
        "Phone1",
        "Website",
        "LastUpdated",
        "StreetAddress1",
        "StreetAddress2",
        "City",
        "State",
        "PostalCode",
        "Leadsource",
        "_CompanyName",
        "_EntityType",
        "_ParentName",
        "_UltimateParentName",
        "_NumberofEmployees",
//        "_AnnualRevenue0",
        "_YearEstablished",
        "_CompanyDescription",
        "_NAICS",
        "_IndustryGroupName"

    ];

    var fields = askFields.concat(customFields);

    isclient.Caller(req.appname, "ContactService.load", [parseInt(req.cid), fields], function(error, contact){

        if(error || !contact){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            res.json(contact);
        }
    });

});

router.get("/all/stages/:appname", function(req,res){

    var query = {StageName: "%"};
    isclient.Caller(req.appname, "DataService.query", ["Stage", 1000, 0, query,["StageName","Id"]], function(error, data){

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
