/**
 * Created by richardbrash on 3/16/15.
 */



var express = require('express');
var isclient = require('../lib/InfusionsoftApiClient');
var moment = require('moment');

var Config = require('../config');


var router = express.Router();

router.post("/", function(req,res){

    var events = req.body;

    for (var key in events){

        for(var configKey in Config.infusionsoftConfigs){

            var config = Config.infusionsoftConfigs[configKey];
            processEvent(events[key], config);
        }

    }

    res.send();
});

var processEvent = function(event, config){

    isclient.Caller(config.AppName, "ContactService.findByEmail", [event.email, ["Id","Email"]], function(error, contact){

      if(!error && contact && contact.length >= 1){

          var creationNotes = "";

          for(var key in event){
              creationNotes += key + ":" + event[key] + ",\n";
          }

          //var note = {
          //    ContactId:contact[0].Id,
          //    UserID:config.UserId,
          //    CreatedBy:config.UserId,
          //    CompletionDate:moment(Date.now()).format('MM/DD/YYYY'),
          //    ActionDate:moment(Date.now()).format('MM/DD/YYYY'),
          //    ActionDescription:"Email Event:" + event.event,
          //    ActionType:"Email Event",
          //    CreationNotes:creationNotes
          //};
          //
          //
          ////  Add note to record details
          //isclient.Caller(config.AppName, "DataService.add", ["ContactAction", note], function(error,data){
          //    if(error){
          //        console.log(error);
          //    }else {
          //
          //    }
          //});

          //  API Call to update scoring
          isclient.Caller(config.AppName, "FunnelService.achieveGoal", ["SendGridEmailHook", event.event, contact[0].Id], function(error, apiresult){
              if(error){
                  console.log(error);
              }else {
                  console.log(apiresult);
              }
          })


      } else {
          console.log(event);
      }

    });

}


module.exports = router;
