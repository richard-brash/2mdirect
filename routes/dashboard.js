/**
 * Created by richardbrash on 5/11/15.
 */


var express = require('express');
var isclient = require('../lib/InfusionsoftApiClient');
var url = require('url');
var moment = require('moment');

var rbmJSONResponse = require("../lib/rbmJSONResponse");

var router = express.Router();

router.param('appName', function(req, res, next, appName){

    req.appName = appName;
    next();

});
router.param('cid', function(req, res, next, cid){

    req.cid = cid;
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

    isclient.Caller(context.appname, "ContactService.load", [context.cid,["FirstName", "LastName", "Email","Id", "CompanyID"]], function(error, contact){

        if(error){
            req.user = null;
        } else {
            req.user = contact;
        }

        next();
    });


});

router.get("/", function(req,res){

    var response = {
        success: true,
        data: 'You are running NodeJS, this is the Dashboard endpoint. I HAVE UDAPTED THE CODE.',
        error: null
    };
    res.render('dashboard', { title: response.data, error: response.error });

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

router.get("/user/:appName/:userid", function(req,res){

    isclient.Caller(req.appName, "DataService.load", ["", req.userid,["FirstName", "LastName",]], function(error, user){

        if(error || !user){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            res.json(user);
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

    isclient.Caller(context.appname, "DataService.query", ["Contact", parseInt(context.take),parseInt(context.skip-1), query,
        [
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
            "_AnnualRevenue0",
            "_YearEstablished",
            "_CompanyDescription",
            "_NAICS",
            "_IndustryGroupName"

    ]
    ],function(error, data){

        if(error){
            res.json(rbmJSONResponse.errorResponse(error));
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

            //  This is where we will get the data
            isclient.Caller(context.appname, "SearchService.getSavedSearchResultsAllFields", [parseInt(savedSearchID), parseInt(userID), 0], function(error, reportData){

                if(error || !reportData){
                    res.json(rbmJSONResponse.errorResponse(error));
                }else {

                    var results = [];

                    for(var i = 0; i < reportData.length; i++){

                        results.push({
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
                            _AnnualRevenue0 : reportData[i].Custom_AnnualRevenue0,
                            _YearEstablished : reportData[i].Custom_YearEstablished,
                            _CompanyDescription : reportData[i].CompanyInfo,
                            Score : reportData[i].ScoreId1,
                            LinkedIn: reportData[i].LinkedInSocialAccountName,
                            _NAICS : reportData[i].Custom_NAICS,
                            _IndustryGroupName : reportData[i].Custom_IndustryGroupName
                        });

                        if(i > 100){
                            i = reportData.length;
                        }



                    }

                    res.json(rbmJSONResponse.successResponse(results));

                }
            });
        }
    });
});

router.get("/:appName/:cid/:configId/:page", function(req,res){

    //  Get the contact
    isclient.Caller(req.appName, "ContactService.load", [req.cid,["FirstName", "LastName", "Email","Id", "CompanyID"]], function(error, contact){

        if(error || !contact){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{

            // Get the companyConfig
            isclient.Caller(req.appName, "DataService.load", ["Company", contact.CompanyID, ["_SendGridConfig"]], function(error, company){
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
                    isclient.Caller(req.appName, "SearchService.getSavedSearchResultsAllFields", [parseInt(savedSearchID), parseInt(userID), parseInt(req.page)], function(error, reportData){

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
