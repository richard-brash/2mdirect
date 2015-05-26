/**
 * Created by richardbrash on 3/10/15.
 */

var express = require('express');
var isclient = require('../lib/InfusionsoftApiClient');
var rbmJSONResponse = require("../lib/rbmJSONResponse");
var mustache = require('mustache');

var router = express.Router();

router.param('appName', function(req, res, next, appName){

    req.appName = appName;
    next();

});
router.param('configId', function(req, res, next, configId){

    req.configId = configId;
    next();

});

router.param('contactId', function(req, res, next, contactId){

    req.contactId = contactId;
    next();

});

router.param('companyId', function(req, res, next, companyId){

    req.companyId = companyId;
    next();

});


router.post("/:appName/:configId", function(req,res){

    var contact = req.body;
    processRequest(req,res,contact);

});


router.post("/:appName/:configId/:contactId", function(req,res){

    isclient.Caller(req.appName, "ContactService.load", [req.contactId,["FirstName", "LastName", "Email","Id", "CompanyID"]], function(error, contact){
        if(error || !contact){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            processRequest(req,res,contact);
        }
    });

});

router.post("/:appName/:configId/:companyId/:contactId", function(req,res){

    isclient.Caller(req.appName, "ContactService.load", [req.contactId,["FirstName", "LastName", "Email","Id"]], function(error, contact){
        if(error || !contact){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            contact.CompanyID = req.companyId;
            processRequest(req,res,contact);
        }
    });

});

router.get("/:appName/:configId/:contactId", function(req,res){

    isclient.Caller(req.appName, "ContactService.load", [req.contactId,["FirstName", "LastName", "Email","Id", "CompanyID"]], function(error, contact){
        if(error || !contact){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            processRequest(req,res,contact);
        }
    });

});

var processRequest = function(req, res, contact){

    //  Define the delimiter
    var delimiter = "{{=~ ~=}}";

    //  Set up the view
    var view = {
        Contact:contact,
        Company:{
            HTMLCanSpamAddressBlock:""
        }
    };

    // Get the companyConfig
    isclient.Caller(req.appName, "DataService.load", ["Company", contact.CompanyID, ["_SendGridConfig"]], function(error, company){
        if(error || !company){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            var companyConfig = JSON.parse(company._SendGridConfig.replace(/&quot;/g,'"'));
            var emailTemplateId = 0;

            for(var key in companyConfig.emailConfigs){
                if(companyConfig.emailConfigs[key].configId == req.configId){
                    emailTemplateId = companyConfig.emailConfigs[key].templateId;
                }
            }

            // Get the email template
            isclient.Caller(req.appName, "APIEmailService.getEmailTemplate",[emailTemplateId], function(error, emailTemplate){

                if(error){
                    res.json(rbmJSONResponse.errorResponse(error));
                }else{

                    // Prepared the template
                    var htmlTemplate = delimiter.concat(emailTemplate.htmlBody);
                    var htmlBody = mustache.to_html(htmlTemplate, view);

                    var textTemplate = delimiter.concat(emailTemplate.textBody);
                    var textBody = mustache.to_html(textTemplate, view);

                    var subjectTemplate = delimiter.concat(emailTemplate.subject);
                    var subject = mustache.to_html(subjectTemplate, view);

                    var sendgrid = require('sendgrid')(companyConfig.sendGrid.userName, companyConfig.sendGrid.password);
                    var email = new sendgrid.Email();

                    email.addTo(contact.Email);
                    email.setFrom(emailTemplate.fromAddress);
                    email.setSubject(subject);
                    email.setHtml(htmlBody);
                    email.setText(textBody);


                    sendgrid.send(email, function(error, result){
                        if(error){
                            res.json(rbmJSONResponse.errorResponse(error));
                        }else {
                            res.json(rbmJSONResponse.successResponse(result));
                        }
                    });

                }

            });



        }

    });






};


/* GET home page. */
router.get('/', function(req, res, next) {

    var delimiter = "{{=~ ~=}}";

    //3412
    isclient.Caller("my122", "APIEmailService.getEmailTemplate",[3412], function(error, emailTemplate){

        res.json(emailTemplate);

    });


    var companyConfigTemplate = {
        "sendGrid": {
            "userName":"jsimpson@2mdirect.com",
            "password":"sendgrid1234!"
        },
        "emailConfigs":[
            {
                "configId":1,
                "templateId":3412
            },
            {
                "configId":2,
                "templateId":3405
            }
        ]
    }


});

module.exports = router;
