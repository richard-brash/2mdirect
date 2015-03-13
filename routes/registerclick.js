/**
 * Created by richardbrash on 3/13/15.
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

router.param('userid', function(req, res, next, userid){

    req.userid = userid;
    next();

});

router.param('clickid', function(req, res, next, clickid){

    req.clickid = clickid;
    next();

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
