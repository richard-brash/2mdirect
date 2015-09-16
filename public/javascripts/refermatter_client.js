/**
 * Created by richardbrash on 9/4/15.
 */


// Read a page's GET URL variables and return them as an associative array.
function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

(function(){

    var toMoney = function(num){
        return '$' + (num.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') );
    };

    var handler = function(element, valueAccessor, allBindings){
        var $el = $(element);
        var method;

        // Gives us the real value if it is a computed observable or not
        var valueUnwrapped = ko.unwrap( valueAccessor() );

        if($el.is(':input')){
            method = 'val';
        } else {
            method = 'text';
        }
        return $el[method]( toMoney( valueUnwrapped ) );
    };

    ko.bindingHandlers.money = {
        update: handler
    };
})();

$(document).ready(function(){

    ko.applyBindings(new AppViewModel(getUrlVars()));

})

function Owner(data){

    var self = this;

    self.name = ko.observable((typeof(data.FirstName) == "undefined") ? data.name : data.FirstName + " " + data.LastName);
    self.email = ko.observable((typeof(data.Email) == "undefined") ? data.email : data.Email);
    self.Id = ko.observable(data.Id);
    self.added = ko.observable(false);

}

function Opportunity(data){

    var self = this;

    self.Id = ko.observable(data.Id);
    self.ContactID = ko.observable(data.ContactID);
    self.CompanyID = ko.observable();
    self.FirstName = ko.observable();
    self.LastName = ko.observable();
    self.Email = ko.observable();

    self.ContactName = ko.observable();

    self.OpportunityTitle = ko.observable(data.OpportunityTitle);
    self.OpportunityId  = ko.observable(data.Id);
    self.StageID = ko.observable(data.StageID);
    self.StageName = ko.observable();

    self.NextActionDate = ko.observable(data.NextActionDate);
    self.DateCreated = ko.observable(data.DateCreated);
    self.OpportunityOwner = ko.observable(data._OwnerName);
    self.OpportunityOwnerEmail = ko.observable(data._OwnerEmail);

    self.TeamMembers = ko.observableArray([]);

    self.appname = ko.observable(data._OwnerName);

    if(typeof(data._TeamMembers) != "undefined"){

        var teammembers = JSON.parse(data._TeamMembers.replace(/&quot;/g,'"'));

        var mapped = $.map(teammembers, function(o) {

            var owner = new Owner(o);

            return owner;

        });

        self.TeamMembers(mapped);
    }


    self.founddata = ko.observable(false);

    self.opportunityClosed = function(){

        //  Update the Opportunity
        var update = {
            appname : self.appname(),
            opid: self.Id(),
            teammembers: ko.toJSON(self.TeamMembers)
        };

        var payload = {
            url: "/refermatter/updateteam",
            method: "POST",
            data: update,
            success: function(response) {


                if (response.success) {
                    toastr.success("Opportunity Team Updated");
                } else {
                    toastr.error(response.error);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                toastr.error(errorThrown);
                console.log(jqXHR);
            }
        };

        $.ajax(payload);


        //  Figure out who gets and email and sent it
        ko.utils.arrayForEach(self.TeamMembers(), function(item) {

            if(item.added()){

                item.added(false);

                var email = {
                    appname : self.appname(),
                    opid: self.Id(),
                    TeamMemberCID:item.Id(),
                    AddresseeName:item.name(),
                    AddresseeEmail:item.email(),
                    ContactName:self.ContactName(),
                    Company:self.OpportunityTitle(),
                    CompanyID: self.CompanyID(),
                    OwnerName:self.OpportunityOwner(),
                    OwnerEmail:self.OpportunityOwnerEmail()
                };

                var payload = {
                    url: "/refermatter/newteammembernotify",
                    method: "POST",
                    data: email,
                    success: function(response) {

                        if (response.success) {
                            toastr.success(item.name() + " notified");
                        } else {
                            toastr.error(response.error);
                        }
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        toastr.error(errorThrown);
                        console.log(jqXHR);
                    }
                };

                $.ajax(payload);

            }



        });

    }


    self.init = function(appname){

        self.appname(appname);



        $.get("/refermatter/contact/" + appname + "/" + parseInt(self.ContactID()) ,function(result){

            if(result.success && result.data){

                self.founddata(true);

                var contact = result.data;

                self.FirstName(contact.FirstName);
                self.LastName(contact.LastName);
                self.Email(contact.Email);
                self.CompanyID(contact.CompanyID);

                self.ContactName(contact.FirstName + " " + contact.LastName);


                $.get("opportunity/stage/" + appname + "/" + parseInt(self.StageID()), function(stage){

                    if(stage.success && stage.data){
                        self.StageName(stage.data.StageName);
                    }

                })


            }

        });

    }


}

function AppViewModel(context){

    var self = this;

    self.context = context;

    self.opportunities = ko.observableArray([]);

    self.owners = ko.observableArray([]);

    self.selectedOpportunity = ko.observable();
    self.newOwner = ko.observable();

    self.foundOpportunityData = ko.observable(false);

    self.ownersLoadMessage = ko.observable("TEST");

    $('html').bind('keypress', function (e) {
        if (e.keyCode == 13) {
            self.getContacts();
            return false;
        }
    });

    self.ownerChanged = function(item){
        var data = ko.toJS(item);

        if(typeof(data.newOwner) != 'undefined' ){
            //  Update the display

            var OldOwnerName = self.selectedOpportunity().OpportunityOwner();
            var OldOwnerEmail = self.selectedOpportunity().OpportunityOwnerEmail();

            self.selectedOpportunity().OpportunityOwner(data.newOwner.name);
            self.selectedOpportunity().OpportunityOwnerEmail(data.newOwner.email);

            //  Save the data back to the server
            var update = {
                appname : self.context["appname"],
                opid: self.selectedOpportunity().Id(),
                newOwnerId:data.newOwner.Id,
                newOwnerName:data.newOwner.name,
                newOwnerEmail:data.newOwner.email,
                OldOwnerName: OldOwnerName,
                OldOwnerEmail: OldOwnerEmail,
                ContactName:self.selectedOpportunity().ContactName(),
                Company:self.selectedOpportunity().OpportunityTitle(),
                CompanyID: self.selectedOpportunity().CompanyID()

            };

            var payload = {
                url: "/refermatter/newowner",
                method: "POST",
                data: update,
                success: function(response) {

                    console.log(response);

                    if (response.success) {
                        toastr.success("Opportunity Owner Updated");
                    } else {
                        toastr.error(response.error);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    toastr.error(errorThrown);
                    console.log(jqXHR);
                }
            };

            $.ajax(payload);


            //  Update the data in the underlying list
            for(var i = 0; i < self.opportunities().length; i++){

                if(self.opportunities()[i].Id() == self.selectedOpportunity().Id()){
                    self.opportunities()[i].OpportunityOwner(data.newOwner.name);
                    self.opportunities()[i].OpportunityOwnerEmail(data.newOwner.email);
                }
            }

        }

    }

    self.addmember = function(item){

        var found = false
        ko.utils.arrayForEach(self.selectedOpportunity().TeamMembers(), function(i) {
            if(i.Id() == item.Id()){
                found = true;
            }
        });

        if (!found) {

            item.added(true);
            self.selectedOpportunity().TeamMembers.push(item);
        }

    }

    self.removemember = function(item){

        self.selectedOpportunity().TeamMembers.remove(item);

    }

    self.referMatter = function(item){

        self.selectedOpportunity(item);
        var data = ko.toJS(item);

        self.ownersLoadMessage("Loading owners...");

        $.get("/refermatter/owners/" + self.context["appname"] + "/" + parseInt(data.CompanyID) ,function(result){

            if(result.success && result.data){

                var mapped = $.map(result.data, function(o) {
                    var owner = new Owner(o);
                    return owner;

                });

                self.owners(mapped);

            } else {
                self.ownersLoadMessage("No owners found...");
            }

        });

    }

    self.getData = function() {

        self.foundOpportunityData(false);

        var payload = {
            url: "/refermatter/" + self.context["appname"] + "/" + self.context["cid"],
            method: "GET",
            success: function(response) {

                if (response.success) {

                    var mapped = $.map(response.data, function(item) {

                        var opportunity = new Opportunity(item);
                        opportunity.init(self.context["appname"]);
                        return opportunity;

                    });

                    self.opportunities(mapped);

                } else {
                    toastr.error(response.error);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                toastr.error(errorThrown);
                console.log(jqXHR);
            }
        };

        $.ajax(payload);

    }();


}
