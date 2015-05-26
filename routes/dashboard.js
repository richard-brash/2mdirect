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

router.param('page', function(req, res, next, page){

    req.page = parseInt(page);
    next();

});

/*

The route needs to have the contactID and the reportID the page number requested
  The process will look up the companyID based on the ContactId
  Pull in the companyConfig and then parse out the savedReportId for the report ID.  This will work similarly to how we do email templates

 */

//  queryString url="URL TO NAVIGATE TO"
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
                            res.render("dashboard",{results:reportData});
                            //res.json(rbmJSONResponse.successResponse(reportData));
                        }
                    });



                }

            });

        }
    });

});


module.exports = router;
