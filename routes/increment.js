/**
 * Created by richardbrash on 5/26/15.
 */


var express = require('express');
var isclient = require('../lib/InfusionsoftApiClient');
var rbmJSONResponse = require("../lib/rbmJSONResponse");

var router = express.Router();

router.param('appName', function(req, res, next, appName){

    req.appName = appName;
    next();

});

router.param('contactId', function(req, res, next, contactId){

    req.contactId = contactId;
    next();

});

router.param('field', function(req, res, next, field){

    req.field = field;
    next();

});

router.param('amount', function(req, res, next, amount){

    req.amount = amount;
    next();

});


router.post("/:appName/:contactId/:field/:amount", function(req,res){

    var contact = req.body;
    processRequest(req,res,contact);

});


router.get("/:appName/:contactId/:field/:amount", function(req,res){

    var field = reg.field;
    var amount = req.amount

    isclient.Caller(req.appName, "ContactService.load", [req.contactId,[field]], function(error, contact){
        if(error || !contact){
            res.json(rbmJSONResponse.errorResponse(error));
        }else{
            processRequest(req,res,contact);
        }
    });

});



module.exports = router;
