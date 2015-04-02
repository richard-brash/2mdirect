/**
 * Created by richardbrash on 3/10/15.
 */

var express = require('express');
var isclient = require('../lib/InfusionsoftApiClient');
var rbmJSONResponse = require("../lib/rbmJSONResponse");
var https = require('https');
var url = require('url');

var router = express.Router();

router.param('appName', function(req, res, next, appName){

    req.appName = appName;
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

router.get("/:appName/:cid/:gid", function(req,res){

    var queryData = url.parse(req.url, true).query;


    // get the contact record
    isclient.Caller(req.appName, "ContactService.load", [req.cid,["FirstName", "LastName", "Email","Id", "CompanyID"]], function(error, contact){
        if(error || !contact){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{

            //  Register the Unsubscribe in Infusionsoft
            isclient.Caller(req.appName, "APIEmailService.optOut", [contact.Email, "Clicked Unsubscribe"], function(){});
            // Apply the Unsubscribe tag
            isclient.Caller(req.appName, "ContactService.addToGroup", [req.cid, req.gid], function(){});

            //  Register the Unsubscribe in SendGrid
            isclient.Caller(req.appName, "DataService.load", ["Company", contact.CompanyID, ["_SendGridConfig"]], function(error, company){
                if(error || !company){
                    res.json(rbmJSONResponse.errorResponse(error));
                }else {
                    var companyConfig = JSON.parse(company._SendGridConfig.replace(/&quot;/g, '"'));

                    var postData = "api_user=" + companyConfig.sendGrid.userName + "&api_key=" + companyConfig.sendGrid.password + "&email=" + contact.Email
                    var headers = {
                        'Content-Type': 'application/json',
                        'Content-Length': postData.length
                    };

                    var options = {
                        host: 'api.sendgrid.com',
                        port: 443,
                        path: '/api/unsubscribes.add.json?' + postData,
                        method: 'POST',
                        headers: headers
                    };


                    // Setup the request.  The options parameter is
                    // the object we defined above.
                    var req = https.request(options, function(res) {
                        res.setEncoding('utf-8');

                        var responseString = '';

                        res.on('data', function(data) {
                            responseString += data;
                        });

                        res.on('end', function() {
                            console.log(responseString);
                        });
                    });

                    req.on('error', function(e) {
                        // TODO: handle error.
                    });

                    req.write(postData);
                    req.end();

                }


            });
        }
    });

    res.redirect(queryData.url);


});


module.exports = router;
