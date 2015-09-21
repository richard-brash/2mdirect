/**
 * Created by richardbrash on 5/26/15.
 */


var express = require('express');
var Config = require('../config');
var isclient = require('../lib/InfusionsoftApiClient');
var sendGridClient = require('../lib/SendGridClient');
var moment = require('moment');
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

router.post("/notifyappointments", function(req,res){

    if(req.context){


        var context = req.context;
        var config = req.config;


        var now = moment();

        var query = {
            NextActionDate : now.format("YYYY-MM-DD HH") + "%"
        }


        isclient.Caller(context.appname, "DataService.query", ["Lead", 1000, 0, query,["NextActionDate", "_OwnerName", "_OwnerEmail", "_OwnerCID", "Id", "ContactID"]],function(error, opportunities){

            for(var i = 0; i < opportunities.length; i++){

                var opportunity = opportunities[i];
                opportunity.NextActionDate = moment(opportunity.NextActionDate).format("LLLL");

                //  Get the Contact record
                isclient.Caller(context.appname, "ContactService.load",[opportunity.ContactID,["Email", "FirstName", "LastName", "_CompanyName", "CompanyID"]],function(error, contact){

                    var afterActionURL = Config.ISConfig(context.appname).afterActionURL;
                    var url = afterActionURL + "?email=" + contact.Email + "&lastname=" + contact.LastName + "&firstname=" + contact.FirstName + "&opid=" + opportunity.Id;

                    //  Set up the email view
                    var view = {
                        Opportunity:{
                            OwnerName:opportunity._OwnerName,
                            CompanyName:contact._CompanyName,
                            FirstName:contact.FirstName,
                            LastName:contact.LastName,
                            NextActionDate:opportunity.NextActionDate,
                            Email:contact.Email,
                            url: url},
                        Company:{
                            HTMLCanSpamAddressBlock:""
                        }
                    };

                    isclient.Caller(context.appname, "DataService.load", ["Company", contact.CompanyID, ["_SendGridConfig"]], function(error, company){
                        if(error || !company){
                            res.json(rbmJSONResponse.errorResponse(error));
                        }else {

                            var companyConfig = JSON.parse(company._SendGridConfig.replace(/&quot;/g, '"'));
                            var emailTemplateId = Config.ISConfig(context.appname).AfterActionTemplate;

                            sendGridClient.SendEmail(context.appname, companyConfig.sendGrid, emailTemplateId, opportunity._OwnerEmail, opportunity._OwnerEmail, view, function(error, result){

                                if(error){

                                    res.json(rbmJSONResponse.errorResponse(error));
                                } else {
                                    res.json(rbmJSONResponse.successResponse(result));
                                }

                            })

                        }

                    });



                });


            }

        });

    } else {
        res.json({message:"DENIED"});
    }





})




router.post("/afteraction", function(req,res){

    if(req.context){
        var context = req.context;
        var config = req.config;


        var customFields = Config.ISConfig(context.appname).customFields;

        var askFields =         [
            "_MeetingNotes",
            "_SalesStageAppointment",
            "_SalesStageLost",
            "_NextSteps",
            "_OpportunityId"
        ];

        var fields = askFields.concat(customFields);


        // Get the salient data from the Contact record.
        isclient.Caller(context.appname, "ContactService.load", [context.cid,fields], function(error, details){

            if(!error && details){

                //  Meeting 1 is the default opportunity stage so, if this is set then the opportunity was lost
                details._SalesStageAppointment = details._SalesStageAppointment.replace(/(\r\n|\n|\r)/gm,"");

                var query = {
                    StageName: details._SalesStageAppointment + "%"
                }

                //  Find the proper StageId
                isclient.Caller(context.appname, "DataService.query",["Stage", 1,0,query, ["Id"]],function(error, stage){

                    if(!error && stage){

                        var nextSteps = details._NextSteps;


                        var opportunity = {
                            NextActionDate:(context.appname == "je230") ? new Date(details._DateOfNextAppointment.replace(/(\r\n|\n|\r)/gm,"")): details._NextAppointmentDate,
                            NextActionNotes:details._NextSteps,
                            StageID:stage[0].Id,
                            _Reason:(details._SalesStageAppointment == "Lost") ? details._SalesStageLost : ""
                        }

                        //  Update the opportunity record
                        isclient.Caller(context.appname, "DataService.update",["Lead", details._OpportunityId, opportunity],function(error, opupdate){

                            if(!error && opupdate){

                                //  Finally, add the note to the contact record
                                var note = {
                                    ContactId : context.cid,
                                    ActionDescription : "After Action Note",
                                    ActionType : "Appointment",
                                    CreationNotes: details._MeetingNotes

                            };

                                isclient.Caller(context.appname, "DataService.add", ["ContactAction", note], function(error, noteadd){
                                    if(!error && noteadd){
                                        res.json(error);
                                    } else{
                                        res.json({});
                                    }
                                });

                            } else {
                                res.json(error);
                            }

                        });


                    } else {
                        res.json(error);
                    }


                })

            } else {
                res.json(error);
            }

        });

    } else {
        res.json({message:"DENIED"});
    }


})

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
