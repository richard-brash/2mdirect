/**
 * Created by richardbrash on 3/16/15.
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

router.param('userid', function(req, res, next, userid){

    req.userid = userid;
    next();

});



router.post("/:appName/:userid", function(req,res){

    var input = req.body;

    //  Find the cid by email
    isclient.Caller(req.appName, "ContactService.findByEmail", [input.email, ["Id"]], function(error, contact){

        if(error || !contact){
            //  do something with the error. probably just want to send a 200 through
            res.send();
        } else {

            var creationNotes = "";
            for(var key in input){
                creationNotes += input[key] + ",\n";
            }

            var note = {
                ContactId:contact.Id,
                UserID:req.userid,
                CreatedBy:req.userid,
                CompletionDate:moment(Date.now()).format('MM/DD/YYYY'),
                ActionDate:moment(Date.now()).format('MM/DD/YYYY'),
                ActionDescription:"Email Event:" + input.event,
                ActionType:input.event,
                CreationNotes:creationNotes
            };

            isclient.Caller(req.appName, "DataService.add", ["ContactAction", note], function(error,data){
                res.send();
            });


        }

    });




});

//  queryString url="URL TO NAVIGATE TO"
router.get("/:appName/:cid/:userid/:clickid", function(req,res){

    var queryData = url.parse(req.url, true).query;


    var note = {
        ContactId:req.cid,
        UserID:req.userid,
        CreatedBy:req.userid,
        CompletionDate:moment(Date.now()).format('MM/DD/YYYY'),
        ActionDate:moment(Date.now()).format('MM/DD/YYYY'),
        ActionDescription:"ClickId:" + req.clickid,
        ActionType:"Link clicked",
        CreationNotes:"Contact clicked a link in email. ClickId: " + req.clickid + ". Contact was redirected to:" + queryData.url
    };

    isclient.Caller(req.appName, "DataService.add", ["ContactAction", note], function(error,data){

        res.redirect(queryData.url);

    });


});


module.exports = router;
