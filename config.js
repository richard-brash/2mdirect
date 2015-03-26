/**
 * Created by richardbrash on 3/10/15.
 */

function Config(){

    var self = this;


    self.sendGridConfigs =[
        {
            Id:1,
            userName:"jsimpson@2mdirect.com",
            password:"sendgrid1234!"
        }

    ]


    self.infusionsoftConfigs = [
        //{
        //    name:"my122",
        //    AppName:"my122",
        //    ApiKey:"66c916b3ded3536b71d3e9c5e61cf30b",
        //    UserId:1
        //},
        //{
        //    name:"RBM",
        //    AppName:"wf129",
        //    ApiKey:"c65d7b76af7bc6785c479e0ec9053af8",
        //    UserId:1
        //},
        {
            name:"M2Direct",
            AppName:"et230",
            ApiKey:"c17788ab5cf2ae112e9da759b50f57f9",
            UserId:1
        },
        {
            name:"AEG",
            AppName:"je230",
            ApiKey:"78fe52c4c1c84254d80bebcaa45a5c4d",
            UserId:1
        },
        {
            name:"Whittaker",
            AppName:"yo230",
            ApiKey:"4f09decba23592b843ae64feb2b8ebf1",
            UserId:1
        }
    ];

    self.ISConfig = function(appName){
        var config = null;

        for(var key in self.infusionsoftConfigs){
            if(self.infusionsoftConfigs[key].AppName == appName){
                config = self.infusionsoftConfigs[key];
            }
        }

        return config;
    }

    self.SendGridConfig = function(id){
        var config = null;

        for(var key in self.sendGridConfigs){
            if(self.sendGridConfigs[key].Id == id){
                config = self.sendGridConfigs[key];
            }
        }

        return config;

    }

}

module.exports = new Config();