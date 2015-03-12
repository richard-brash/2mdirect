/**
 * Created by richardbrash on 3/10/15.
 */

var express = require('express');
var config = require('../config');
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
router.param('emailId', function(req, res, next, emailId){

    req.emailId = emailId;
    next();

});

router.param('contactId', function(req, res, next, contactId){

    req.contactId = contactId;
    next();

});

router.post("/:appName/:configId/:contactId", function(req,res){

    var contact = req.body;
    processRequest(req,res,contact);

});


router.post("/junk", function(req,res){

    var contact = req.body;
    isclient.Caller("my122", "ContactService.update", [843, {ContactNotes:contact}], function(error,value){

        if(error || !contact){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            res.json(rbmJSONResponse.successResponse(value));
        }
    })


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

//        if(error){
//            res.json(rbmJSONResponse.errorResponse(error));
//        }else {
//
//            isclient.Caller("SANDBOX", "ContactService.load", [843, ["FirstName", "LastName", "Email", "Id"]], function(e,contact){
//                if(e){
//                    res.json(rbmJSONResponse.errorResponse(error));
//                } else {
//
//                    var view = {
//                        Contact:contact,
//                        Company:{
//                            HTMLCanSpamAddressBlock:""
//                        }
//                    }
//
//                    var htmlTemplate = delimiter.concat(emailTemplate.htmlBody);
//                    var html = mustache.to_html(htmlTemplate, view);
//
//                    var subjectTemplate = delimiter.concat(emailTemplate.subject);
//                    var subject = mustache.to_html(subjectTemplate, view);
//
//
//                    var sendgrid = require('sendgrid')(config.sendGrid.userName, config.sendGrid.password);
//                    var email = new sendgrid.Email();
//
//                    email.addTo(contact.Email);
//                    email.setFrom(emailTemplate.fromAddress);
//                    email.setSubject(subject);
//                    email.setHtml(html);
//                    sendgrid.send(email, function(error, result){
//                        if(error){
//                            res.json(rbmJSONResponse.errorResponse(error));
//                        }else {
//                            res.send(html);
////                            res.json(rbmJSONResponse.successResponse(result));
//                        }
//                    });
//                }
//            });
//        }
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


    //{
    //    configID:123,
    //    templateId:3412,
    //    sendGrid : {
    //        userName:"jsimpson@2mdirect.com",
    //        password:"sendgrid1234!"
    //    },
    //    mappings:[
    //        {
    //            replaceSource:"Data",
    //            replaceValue:"FirstName",
    //            replaceSearch:"~Contact.FirstName~"
    //        },
    //        {
    //            replaceSource:"Literal",
    //            replaceValue:"",
    //            replaceSearch:"~Company.HTMLCanSpamAddressBlock~"
    //        }
    //
    //    ]
    //};

/*

The endpoint will be a POST and the Contact record will be sent with the post Data ("All contact fields are included in the HTTP post (standard Infusionsoft fields and the custom fields you create).")
The path args needs to include:
 ISConfig to use.
 configID

The CompanyID

:ISConfig/:configID

get Client(Company) configuration using Contact.CompanyID (Custom Field for JSON config Data)
get the Email template configured in configuration
Replace the mapped data on both htmlBody and the textBody
set the to address.
set the from address
set the subject
set the HTML Body
set the Text Body
send the email


 */


});

module.exports = router;
