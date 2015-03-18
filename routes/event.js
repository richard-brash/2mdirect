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

    var events = req.body;

    for (var key in events){
        processEvent(events[key], req);
    }

    res.send();
});

var processEvent = function(event, req){

    isclient.Caller(req.appName, "ContactService.findByEmail", [event.email, ["Id","Email"]], function(error, contact){

      if(!error && contact && contact.length >= 1){

          var creationNotes = "";

          for(var key in event){
              creationNotes += key + ":" + event[key] + ",\n";
          }

          var note = {
              ContactId:contact[0].Id,
              UserID:req.userid,
              CreatedBy:req.userid,
              CompletionDate:moment(Date.now()).format('MM/DD/YYYY'),
              ActionDate:moment(Date.now()).format('MM/DD/YYYY'),
              ActionDescription:"Email Event:" + event.event,
              ActionType:"Email Event",
              CreationNotes:creationNotes
          };


          isclient.Caller(req.appName, "DataService.add", ["ContactAction", note], function(error,data){
              if(error){
                  console.log(error);
              }else {

              }
          });

      } else {
          console.log(event);
      }

    });

}


module.exports = router;
