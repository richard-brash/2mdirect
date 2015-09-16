/**
 * Created by richardbrash on 9/4/15.
 */


var express = require('express');
var isclient = require('../lib/InfusionsoftApiClient');
var sendGridClient = require('../lib/SendGridClient');
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


router.get("/owners/:appname/:cid", function(req,res){

    var query = {
        CompanyID: req.cid,
        ContactType: "Team Member"
    }

    isclient.Caller(req.appname, "DataService.query", ["Contact", 1000, 0, query,["FirstName", "LastName", "Email","Id"]], function(error, teammembers){

        if(error || !teammembers){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            res.json(rbmJSONResponse.successResponse(teammembers));
        }

    });

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

router.post("/updateteam", function(req,res){

    var context = req.body;
    var data = {
        _TeamMembers:context.teammembers
    };

    isclient.Caller(context.appname, "DataService.update", ["Lead", parseInt(context.opid), data],function(error, data){
        if(error || !data){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            res.json(rbmJSONResponse.successResponse(data));
        }
    });

})

router.post("/newteammembernotify", function(req,res){

    var context = req.body;


    //  Set up the email view
    var view = {
        Opportunity:{
            AddresseeName: context.AddresseeName,
            OwnerName:context.OwnerName,
            OwnerEmail:context.OwnerEmail,
            Company:context.Company,
            ContactName:context.ContactName},
        Company:{
            HTMLCanSpamAddressBlock:""
        }
    };

    isclient.Caller(context.appname, "DataService.load", ["Company", context.CompanyID, ["_SendGridConfig"]], function(error, company){
        if(error || !company){
            res.json(rbmJSONResponse.errorResponse(error));
        }else {

            var companyConfig = JSON.parse(company._SendGridConfig.replace(/&quot;/g, '"'));
            var emailTemplateId = Config.ISConfig(context.appname).TeamMemberTemplate;

            sendGridClient.SendEmail(context.appname, companyConfig.sendGrid, emailTemplateId, context.AddresseeEmail, context.OwnerEmail, view, function(error, result){

                if(error){

                    res.json(rbmJSONResponse.errorResponse(error));
                } else {
                    res.json(rbmJSONResponse.successResponse(result));
                }

            })

        }

    });




});


router.post("/newowner", function(req,res){

    var context = req.body;

    var data = {
        _OwnerName:context.newOwnerName,
        _OwnerEmail:context.newOwnerEmail,
        _OwnerCID:context.newOwnerId
    };

    //  Set up the email view
    var view = {
        Opportunity:{
            OwnerName: context.newOwnerName,
            OldOwnerName:context.OldOwnerName,
            Company:context.Company,
            ContactName:context.ContactName},
        Company:{
            HTMLCanSpamAddressBlock:""
        }
    };

    isclient.Caller(context.appname, "DataService.update", ["Lead", parseInt(context.opid), data],function(error, data){

        if(error){
            res.json(rbmJSONResponse.errorResponse(error));
        } else {


            isclient.Caller(context.appname, "DataService.load", ["Company", context.CompanyID, ["_SendGridConfig"]], function(error, company){
                if(error || !company){
                    res.json(rbmJSONResponse.errorResponse(error));
                }else {

                    var companyConfig = JSON.parse(company._SendGridConfig.replace(/&quot;/g, '"'));
                    var emailTemplateId = Config.ISConfig(context.appname).NewOwnerTemplate;

                    sendGridClient.SendEmail(context.appname, companyConfig.sendGrid, emailTemplateId, context.newOwnerEmail, context.OldOwnerEmail, view, function(error, result){

                        if(error){

                            res.json(rbmJSONResponse.errorResponse(error));
                        } else {
                            res.json(rbmJSONResponse.successResponse(result));
                        }

                    })

                }

            });
        }

    });

});

router.get("/:appname/:cid", function(req,res){

    var query = {};

    query["_OwnerCID"] = req.cid;

    isclient.Caller(req.appname, "DataService.query", ["Lead", 1000, 0, query,[
        "OpportunityTitle",
        "ContactID",
        "Id",
        "StageID",
        "NextActionDate",
        "DateCreated",
        "_OwnerName",
        "_OwnerEmail",
        "_TeamMembers"
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
