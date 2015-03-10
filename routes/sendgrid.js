/**
 * Created by richardbrash on 3/10/15.
 */

var express = require('express');
var router = express.Router();
var rbmJSONResponse = require("../lib/rbmJSONResponse");
var sendgrid = require('sendgrid')('jsimpson@2mdirect.com', 'sendgrid1234!');


/* GET home page. */
router.get('/', function(req, res, next) {

    var template = {
        "filters": {
            "templates": {
                "settings": {
                    "enable": 1,
                    "template_id": "55674ce7-037d-4cc6-886a-c89b98dacbfe"
                }
            }
        }
    };

    var smtpapi = new sendgrid.smtpapi(template);

    var params = {
        smtpapi:  smtpapi,
        to      : 'richard@richardbrash.com',
        from    : 'jsimpson@2mdirect.com',
        subject : 'Saying Hi AGAIN',
        text    : '<b>This is my first email through SendGrid</b>'
    };

    var email = new sendgrid.Email(params);

    sendgrid.send(email, function(err, json) {
        if (err) {
            console.error(err);
            res.json(rbmJSONResponse.errorResponse(err));
        } else {
            res.json(rbmJSONResponse.successResponse(json));
        }
    });




});

module.exports = router;
