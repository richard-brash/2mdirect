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
            RBMKey:"J6M7F6dxZ0",
            Category:50,
            UserId:1,
            customFields: ["_AnnualRevenue0", "_NextAppointmentDate"],
            opportunityFieldMapping:[

                {NextAppointmentDate : "_NextAppointmentDate"}

            ],
            afterActionURL: "http://dilogr.com/app1/s/afteractionreport",
            TeamMemberTemplate: 3777,
            NewOwnerTemplate: 3779,
            compassCategories: [51,53,55,57,59,61,63,65,67,69,71]
        },
        {
            name:"AEG",
            AppName:"je230",
            RBMKey:"J6M7F6dxZ0",
            ApiKey:"78fe52c4c1c84254d80bebcaa45a5c4d",
            UserId:1,
            customFields: ["_AnnualRevenue", "_DateOfNextAppointment"],
            afterActionURL: " http://dilogr.com/app1/s/afteractionje230",
            TeamMemberTemplate: 3663,
            NewOwnerTemplate: 3661,
            compassCategories: [39,41,43,45,47,49,51,53,55,57,59,61]

        },
        {
            name:"Whittaker",
            AppName:"yo230",
            ApiKey:"4f09decba23592b843ae64feb2b8ebf1",
            UserId:1,
            Dashboard:123
        },
        {
            name:"2MDirect",
            AppName:"cd236",
            ApiKey:"bb8900ef30e3d7ffd0ff0e133cf108c56b9b4c9c45cbc3919a6bb08fb44f9022",
            UserId:1,
            Dashboard:123
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