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
    }

    next();



});


router.post("/", function(req,res){

    if(req.context){

        var data = JSON.parse(req.context.data);

        isclient.Caller(req.context.appname, "DataService.update", [req.context.table, req.context.recordid,data], function(error, data){

            if(error || !data){
                res.json(rbmJSONResponse.errorResponse(error));
            }else{
                res.json(rbmJSONResponse.successResponse(data));
            }
        });

    } else {
        res.json({message:"DENIED"});
    }



});


module.exports = router;
