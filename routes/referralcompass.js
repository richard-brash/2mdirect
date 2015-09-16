/**
 * Created by richardbrash on 9/16/15.
 */


var express = require('express');
var url = require('url');
async = require("async");
var isclient = require('../lib/InfusionsoftApiClient');
var Config = require('../config');


var rbmJSONResponse = require("../lib/rbmJSONResponse");

var router = express.Router();

router.param('appname', function(req, res, next, appname){

    req.appname = appname;
    next();

});

router.param('cid', function(req, res, next, cid){

    req.cid = parseInt(cid);
    next();

});



router.get('/tags/:appname', function(req,res){

    var categories = Config.ISConfig(req.appname).compassCategories;

    var data = [];

// 1st para in async.each() is the array of items
    async.each(categories,

        // 2nd param is the function that each item is passed to
        function(item, callback){
            // Call an asynchronous function, often a save() to DB

            var query = {GroupCategoryId: parseInt(item)}

            //  First, get the Category Name

            isclient.Caller(req.appname, "DataService.load", ["ContactGroupCategory",parseInt(item), ["Id", "CategoryName", "CategoryDescription"] ], function(error, category){

                if(error){
                    callback(error);
                } else {
                    isclient.Caller(req.appname, "DataService.query", ["ContactGroup", 1000, 0, query,["Id", "GroupName", "GroupDescription"]], function(error, groups){

                        if(error || !groups){
                            callback(error);
                        }else{

                            data = data.concat({Category:category, Groups: groups});
                            callback();

                        }

                    });
                }
            });

        },
        // 3rd param is the function to call when everything's done
        function(err){

            if(err){
                res.json(rbmJSONResponse.errorResponse(err));
            }else{
                res.json(rbmJSONResponse.successResponse(data));
            }
        }
    );


})


module.exports = router;
