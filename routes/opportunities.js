/**
 * Created by richardbrash on 5/11/15.
 */


var express = require('express');
var isclient = require('../lib/InfusionsoftApiClient');
var url = require('url');
var moment = require('moment');
var Config = require('../config');

var rbmJSONResponse = require("../lib/rbmJSONResponse");

var router = express.Router();

router.param('appname', function(req, res, next, appname){

    req.appname = appname;
    next();

});
router.param('cid', function(req, res, next, cid){

    req.cid = cid;
    next();

});


router.use(function (req, res, next) {
    var context = req.body;

    if(context.appname != ""){
        isclient.Caller(context.appname, "ContactService.load", [context.cid,["FirstName", "LastName", "Email","Id", "CompanyID"]], function(error, contact){

            if(error){
                req.user = null;
            } else {
                req.user = contact;
            }

            next();
        });

    } else {
        next();
    }


});

router.post("/list", function(req,res){

    var context = req.body;

    var query = {};

    query["_CompanyID"] = req.user.CompanyID;

    isclient.Caller(context.appname, "DataService.query", ["Lead", 1000, 0, query,[
        "OpportunityTitle",
        "Id",
        "StageID",
        "ContactID",
        "NextActionDate",
        "NextActionNotes",
        "DateCreated",
        "_OwnerName",
        "_OwnerEmail"
    ]
    ], function(error, data){

        if(error || !data){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            res.json(rbmJSONResponse.successResponse(data));
        }
    });


});



router.post("/notes", function(req,res){

    var context = req.body;

    var query = {
        ContactId : parseInt(context.cid)
    };

    isclient.Caller(context.appname, "DataService.query", ["ContactAction", 1000,0, query,
        [
            "Id",
            "UserID",
            "CreationDate",
            "CreationNotes",
            "ActionDescription"
        ]
    ],function(error, data){

        if(error){
            res.json(rbmJSONResponse.errorResponse(error));
        } else {
            res.json(rbmJSONResponse.successResponse(data));
        }

    });

});

router.post("/search", function(req,res){

    var context = req.body;

    var filters = JSON.parse(context.filters);
    var query = {};

    for(var index in filters){
        query[filters[index].field] = filters[index].value + "%";
    }

    query["CompanyID"] = req.user.CompanyID;

    var customFields = Config.ISConfig(context.appname).customFields;

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



    isclient.Caller(context.appname, "DataService.query", ["Contact", parseInt(context.take),parseInt(context.skip-1), query, fields
    ],function(error, data){

        if(error){
            res.json(rbmJSONResponse.errorResponse(error));
        } else {
            res.json(rbmJSONResponse.successResponse(data));
        }

    });

});


module.exports = router;
