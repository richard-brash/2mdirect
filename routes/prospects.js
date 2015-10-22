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

router.param('gid', function(req, res, next, gid){

    req.gid = gid;
    next();

});


router.param('configId', function(req, res, next, configId){

    req.configId = configId;
    next();

});

router.param('savedsearchid', function(req, res, next, savedsearchid){

    req.savedsearchid = parseInt(savedsearchid);
    next();

});

router.param('userid', function(req, res, next, userid){

    req.userid = parseInt(userid);
    next();

});


router.use(function (req, res, next) {
    var context = req.body;
    if(context.appname){
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

router.get("/", function(req,res){

    var response = {
        success: true,
        data: 'You are running NodeJS, this is the Dashboard endpoint. I HAVE UDAPTED THE CODE.',
        error: null
    };
    res.render('dashboard', { title: response.data, error: response.error });

})

router.post("/opportunity", function(req,res){
    var context = req.body;

    var opportunity = {
        ContactID: context.ContactID,
        OpportunityTitle: context.OpportunityTitle,
        _CompanyID: context._CompanyID,
        NextActionDate: context.NextActionDate,
        NextActionNotes: context.NextActionNotes,
        _OwnerCID: context._OwnerCID,
        _OwnerName: context._OwnerName,
        _OwnerEmail: context._OwnerEmail
    }

    isclient.Caller(context.appname, "DataService.add", ["Lead", opportunity],function(error, result){
        if(error){
            res.json(rbmJSONResponse.errorResponse(error));
        } else {
            res.json(rbmJSONResponse.successResponse(result));
        }
    })

})

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
            "ActionDescription",
            "_NoteRecorder"
        ],
        "CreationDate",
        false
    ],function(error, data){

        if(error){
            res.json(rbmJSONResponse.errorResponse(error));
        } else {
            res.json(rbmJSONResponse.successResponse(data));
        }

    });

});

router.get("/:appname/:userid", function(req,res){

    isclient.Caller(req.appname, "DataService.load", ["Contact", req.userid,["FirstName", "LastName", "Email"]], function(error, user){

        if(error || !user){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            res.json(user);
        }
    });

});

router.get("/withtag/:appname/:cid/:gid", function(req,res){

    isclient.Caller(req.appname, "ContactService.load", [req.cid,["CompanyID"]], function(error, user) {

        if (error || !user) {
            res.json(rbmJSONResponse.errorResponse(error));
        } else {


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

            var query = {
                Groups: "%" + req.gid + "%",
                CompanyID: user.CompanyID
            };

            isclient.Caller(req.appname, "DataService.query", ["Contact", 1000, 0, query,fields], function (error, data) {

                if (error) {
                    res.json(rbmJSONResponse.errorResponse(error));
                } else {
                    res.json(rbmJSONResponse.successResponse(data));
                }
            });
        }
    });

});

router.get("/byid/:appname/:cid", function(req,res){

    var customFields = Config.ISConfig(req.appname).customFields;

    var askFields =         [
        "Id",
        "Company",
        "CompanyID",
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

    isclient.Caller(req.appname, "ContactService.load", [parseInt(req.cid),fields],
        function(error, data){

            if(error){
                res.json(rbmJSONResponse.errorResponse(error));
            } else {
                res.json(rbmJSONResponse.successResponse(data));
            }

        });


})

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

    isclient.Caller(context.appname, "DataService.query", ["Contact", parseInt(context.take),parseInt(context.skip-1), query,fields],
        function(error, data){

        if(error){
            res.json(error);
        } else {
            res.json(rbmJSONResponse.successResponse(data));
        }

    });

});

router.post("/savedsearch", function(req,res){

    var context = req.body;

    // Get the companyConfig
    isclient.Caller(context.appname, "DataService.load", ["Company", req.user.CompanyID, ["_SendGridConfig"]], function(error, company){
        if(error || !company){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            var companyConfig = JSON.parse(company._SendGridConfig.replace(/&quot;/g,'"'));
            var savedSearchID = 0;
            var userID = 0;

            for(var key in companyConfig.reportConfigs){
                if(companyConfig.reportConfigs[key].configId == context.configid){
                    savedSearchID = companyConfig.reportConfigs[key].savedSearchID;
                    userID = companyConfig.reportConfigs[key].userID;
                }
            }

            var customFields = Config.ISConfig(context.appname).customFields;

            //  This is where we will get the data
            isclient.Caller(context.appname, "SearchService.getSavedSearchResultsAllFields", [parseInt(savedSearchID), parseInt(userID), 0], function(error, reportData){

                if(error || !reportData){
                    res.json(rbmJSONResponse.errorResponse(error));
                }else {

                    var results = [];

                    for(var i = 0; i < reportData.length; i++){

                        var data = {
                            Id: reportData[i].Id,
                            Company : reportData[i].Company,
                            FirstName : reportData[i]['ContactName.firstName'],
                            LastName : reportData[i]['ContactName.lastName'],
                            Email : reportData[i].Email,
                            JobTitle : reportData[i].JobTitle,
                            Phone1 : reportData[i].PhoneWithExtension1,
                            Website : reportData[i].Website,
                            LastUpdated : reportData[i].LastUpdated,
                            StreetAddress1 : reportData[i].StreetAddress1,
                            StreetAddress2 : reportData[i].StreetAddress2,
                            City : reportData[i].City,
                            State : reportData[i].State,
                            PostalCode : reportData[i].PostalCodePlusZipFour1,
                            Leadsource : reportData[i].Leadsource,
                            _CompanyName : reportData[i].Custom_CompanyName,
                            _EntityType : reportData[i]. Custom_EntityType,
                            _ParentName : reportData[i].Custom_ParentName,
                            _UltimateParentName : reportData[i].Custom_UltimateParentName,
                            _NumberofEmployees : reportData[i].Custom_NumberofEmployees,
                            _YearEstablished : reportData[i].Custom_YearEstablished,
                            _CompanyDescription : reportData[i].Custom_CompanyDescription,
                            Score : reportData[i].ScoreId1,
                            LinkedIn: reportData[i].LinkedInSocialAccountName,
                            _NAICS : reportData[i].Custom_NAICS,
                            _IndustryGroupName : reportData[i].Custom_IndustryGroupName
                        };

                        for(var c = 0; c < customFields.length; c++){
                            data[customFields[c]] = reportData[i]["Custom" + customFields[c]];
                        }

                        results.push(data);

                        if(i > 25){
                            i = reportData.length;
                        }



                    }

                    res.json(rbmJSONResponse.successResponse(results));

                }
            });
        }
    });
});

router.get("/:appname/:cid/:configId/:page", function(req,res){

    //  Get the contact
    isclient.Caller(req.appname, "ContactService.load", [req.cid,["FirstName", "LastName", "Email","Id", "CompanyID"]], function(error, contact){

        if(error || !contact){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{

            // Get the companyConfig
            isclient.Caller(req.appname, "DataService.load", ["Company", contact.CompanyID, ["_SendGridConfig"]], function(error, company){
                if(error || !company){
                    res.json(rbmJSONResponse.errorResponse(error));
                }else{
                    var companyConfig = JSON.parse(company._SendGridConfig.replace(/&quot;/g,'"'));
                    var savedSearchID = 0;
                    var userID = 0;

                    for(var key in companyConfig.reportConfigs){
                        if(companyConfig.reportConfigs[key].configId == req.configId){
                            savedSearchID = companyConfig.reportConfigs[key].savedSearchID;
                            userID = companyConfig.reportConfigs[key].userID;
                        }
                    }

                    //  This is where we will get the data
                    isclient.Caller(req.appname, "SearchService.getSavedSearchResultsAllFields", [parseInt(savedSearchID), parseInt(userID), parseInt(req.page)], function(error, reportData){

                        if(error || !reportData){
                            res.json(rbmJSONResponse.errorResponse(error));
                        }else {
                            //res.render("dashboard",{results:reportData});

                            res.json(reportData);
                        }
                    });



                }

            });

        }
    });

});


module.exports = router;
