/**
 * Created by richardbrash on 5/26/15.
 */


var express = require('express');
var Config = require('../config');
var isclient = require('../lib/InfusionsoftApiClient');
var sendGridClient = require('../lib/SendGridClient');
//var moment = require('moment');
var moment = require('moment-timezone');
var rbmJSONResponse = require("../lib/rbmJSONResponse");

var router = express.Router();

router.param('appname', function(req, res, next, appname){

    req.appname = appname;
    next();

});

router.param('rbmkey', function(req, res, next, rbmkey){

    req.rbmkey = rbmkey;
    next();

});

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


router.get("/notifyappointments/:appname/:rbmkey", function(req,res){


    var config = Config.ISConfig(req.appname);

    var allowed = false;

    if(config && req.rbmkey == config.RBMKey){
        allowed  = true;
    }

    if(allowed){

        var now = moment.tz("America/New_York");

        var query = {
            NextActionDate : now.format("YYYY-MM-DD HH") + "%"
        }


        var response = {
            query: query,
            Results: []
        };

        isclient.Caller(req.appname, "DataService.query", ["Lead", 1000, 0, query,["NextActionDate", "_OwnerName", "_OwnerEmail", "_OwnerCID", "Id", "ContactID"]],function(error, opportunities){

            for(var i = 0; i < opportunities.length; i++){

                var opportunity = opportunities[i];
                opportunity.NextActionDate = moment(opportunity.NextActionDate).format("LLLL");

                //  Get the Contact record
                isclient.Caller(req.appname, "ContactService.load",[opportunity.ContactID,["Email", "FirstName", "LastName", "_CompanyName", "CompanyID"]],function(error, contact){

                    var afterActionURL = Config.ISConfig(req.appname).afterActionURL;
                    var url = afterActionURL + "?email=" + contact.Email + "&lastname=" + contact.LastName + "&firstname=" + contact.FirstName + "&opid=" + opportunity.Id + "&recorderid=" + opportunity._OwnerCID;

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

                    isclient.Caller(req.appname, "DataService.load", ["Company", contact.CompanyID, ["_SendGridConfig"]], function(error, company){
                        if(error || !company){
                            res.json(rbmJSONResponse.errorResponse(error));
                        }else {

                            var companyConfig = JSON.parse(company._SendGridConfig.replace(/&quot;/g, '"'));
                            var emailTemplateId = Config.ISConfig(req.appname).AfterActionTemplate;

                            sendGridClient.SendEmail(req.appname, companyConfig.sendGrid, emailTemplateId, opportunity._OwnerEmail, opportunity._OwnerEmail, view, function(error, result){

                                if(error){

                                    res.json(rbmJSONResponse.errorResponse(error));
                                } else {
                                    response.Results.push({OpportunityId:opportunity.Id, result:result});
                                }

                            })

                        }

                    });



                });


            }


            res.json(rbmJSONResponse.successResponse(response));

        });

    } else {
        res.json({message:"DENIED"});
    }


})

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
                    var url = afterActionURL + "?email=" + contact.Email + "&lastname=" + contact.LastName + "&firstname=" + contact.FirstName + "&opid=" + opportunity.Id + "&recorderid=" + opportunity._OwnerCID;

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
            "_OpportunityId",
            "_RecorderId"
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


                        var nextappointmentdate = null;

                        if(context.appname == "je230"){

                            if( (details._NextAppointmentDate4 || typeof(details._NextAppointmentDate4) == "undefined") && details._SalesStageAppointment != "Lost"){
                                var date = moment().add(1, 'months').format("YYYY-MM-DD");
                                nextappointmentdate = new Date(date);
                                nextSteps += "\n ***** THIS DATE IS NOT AN APPOINTMENT, IT IS A REMINDER TO KEEP THE OPPORTUNITY FRESH *****"
                            } else {
                                if(details._NextAppointmentDate4 && typeof(details._NextAppointmentDate4) != "undefined"){
                                    nextappointmentdate = new Date(details._NextAppointmentDate4.replace(/(\r\n|\n|\r)/gm,""));
                                }

                            }


                        } else {

                            if( (details._NextAppointmentDate || typeof( details._NextAppointmentDate) == "undefined") && details._SalesStageAppointment != "Lost"){
                                var date = moment().add(1, 'months').format("YYYY-MM-DD");
                                nextappointmentdate = new Date(date);
                                nextSteps += "\n ***** THIS DATE IS NOT AN APPOINTMENT, IT IS A REMINDER TO KEEP THE OPPORTUNITY FRESH *****"
                            } else {
                                nextappointmentdate = details._NextAppointmentDate;
                            }

                        }



                        var opportunity = {
                            NextActionNotes:nextSteps,
                            StageID:stage[0].Id,
                            _Reason:(details._SalesStageAppointment == "Lost") ? details._SalesStageLost : ""
                        }

                        if(nextappointmentdate)
                        {
                            opportunity.NextActionDate = nextappointmentdate
                        }

                        isclient.Caller(context.appname, "ContactService.load", [details._RecorderId,["FirstName", "LastName"]], function(error, recorder){

                            var recordername = "";

                            if(!error && recorder){
                                recordername = recorder.FirstName + " " + recorder.LastName;
                            }

                            isclient.Caller(context.appname, "DataService.update",["Lead", details._OpportunityId, opportunity],function(error, opupdate){

                                if(!error && opupdate){

                                    //  Finally, add the note to the contact record
                                    var note = {
                                        ContactId : context.cid,
                                        ActionDescription : "After Action Note",
                                        ActionType : "Appointment",
                                        CreationNotes: details._MeetingNotes,
                                        _NoteRecorder: recordername

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

                        })

                        //  Update the opportunity record



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
