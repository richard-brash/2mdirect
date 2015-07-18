/**
 * Created by richardbrash on 5/26/15.
 */


var express = require('express');
var Config = require('../config');
var isclient = require('../lib/InfusionsoftApiClient');
var rbmJSONResponse = require("../lib/rbmJSONResponse");

var router = express.Router();

router.use(function (req, res, next) {


    var context = req.body;
    var rbmkey = context.rbmkey;
    var appname = context.appname;

    var config = Config.ISConfig(appname);

    if(config && rbmkey == config.RBMKey){
        req.context = req.body;
        req.config = config;
    }

    next();

});

router.post("/", function(req,res){

    if(req.context){

        var context = req.context;
        var config = req.config;


        //  We want to get all the tags in the target catgory
        isclient.Caller(context.appname, "DataService.query", ["ContactGroup", 1000, 0, {GroupCategoryId:config.Category}, ["GroupDescription", "GroupName", "Id", "GroupCategoryId"]], function(error, targetgroups){

            if(!error && targetgroups){

                //  Loop through the target groups
                var targetgroup;
                for(targetgroup in targetgroups){
                    checkTarget(context.appname, context.cid,targetgroups[targetgroup].Id, targetgroups[targetgroup]);
                }

            }

            res.json(rbmJSONResponse.successResponse(targetgroups));

        });

    } else {
        res.json({message:"DENIED"});
    }



});

var checkTarget = function(appname, cid, gid, group){

    //  See if the contact has the target tag in question
    isclient.Caller(appname, "DataService.query", ["ContactGroupAssign", 1000, 0, {ContactId:cid, GroupId:gid}, ["ContactId", "GroupId"]], function(error, contactgroups){

        if(!error && contactgroups && contactgroups.length > 0){

            var company = JSON.parse(group.GroupDescription.replace(/&quot;/g,'"'));

            console.log("Contact:" + cid + " has target group tag:" + gid + " so, we are going to set the company to: " + company.id);

            //  Set the Company Name
            isclient.Caller(appname, "ContactService.update", [cid,{Company:company.name}],function(error, result){
                if(!error){
                    console.log(result);
                    //  Set the CompanyID
                    isclient.Caller(appname, "ContactService.update", [cid,{CompanyID:parseInt(company.id)}],function(error, result){
                        if(!error){
                            console.log(result);

                            //  Remove the tag
                            isclient.Caller(appname, "ContactService.removeFromGroup", [cid,gid],function(error,result){
                                console.log(result);
                            });

                        }

                    });



                }
            });


        }

    });

}

module.exports = router;
