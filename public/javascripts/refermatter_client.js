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

function Note(data){
    var self = this;
    self.Id = ko.observable(data.Id);
    self.UserID = ko.observable(data.UserID);
    self.UserName = ko.observable(data.UserName);
    self.CreationDate = ko.observable(data.CreationDate);
    self.CreationNotes = ko.observable((data.CreationNotes) ? data.CreationNotes : "[No Notes]" );
    self.ActionDescription = ko.observable(data.ActionDescription);

    self.showMe = ko.observable(true);

    self.init = function(appname){

        if(self.CreationNotes() == "[No Notes]"){
            self.showMe(false);
        }

        if(self.ActionDescription().indexOf("turboDial") != -1){

            var notes = "";

            var lines = self.CreationNotes().split("\n");

            for(var i=0; i<lines.length; i++){

                var addme = true;

                if(lines[i].indexOf("turboDial Conversation") === 0){
                    addme = false;
                }

                if(lines[i].indexOf("Started at: ") === 0){
                    addme = false;
                }

                if(lines[i].indexOf("Twilio ID=") === 0){
                    addme = false;
                }

                if(lines[i].indexOf("Call Outcome Goal Triggered") === 0){
                    addme = false;
                }

                if(lines[i].indexOf("Integration=turboDial") === 0){
                    addme = false;
                }

                if(lines[i].indexOf("Call Name=") === 0){
                    addme = false;
                }


                if(addme){
                    notes += lines[i] + "<br/>";
                }

            }

            if(notes == ""){
                self.showMe(false);
            } else {
                self.CreationNotes(notes);
            }

        }

        if(self.showMe()){
            $.get("infusionsoftuser/" + appname + "/" + parseInt(self.UserID()) ,function(result){

                if(result.success){
                    self.UserName(result.data.FirstName + " " + result.data.LastName);
                } else {
                    self.UserName("Marketing");
                }

            });
        }
    }


}

function Owner(data){

    var self = this;
    self.name = ko.observable(data.name);
    self.email = ko.observable(data.email);


}

function Opportunity(data){

    var self = this;

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

    self.founddata = ko.observable(false);

    self.init = function(appname){

        $.get("/refermatter/contact/" + appname + "/" + parseInt(self.ContactID()) ,function(result){

            if(result.success && result.data){

                self.founddata(true);

                var contact = result.data;

                self.FirstName(ko.observable(contact.FirstName));
                self.LastName(ko.observable(contact.LastName));
                self.Email(ko.observable(contact.Email));
                self.CompanyID(ko.observable(contact.CompanyID));

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
    self.foundOpportunityData = ko.observable(false);

    self.ownersLoadMessage = ko.observable("");

    $('html').bind('keypress', function (e) {
        if (e.keyCode == 13) {
            self.getContacts();
            return false;
        }
    });

    self.referMatter = function(item){

        self.selectedOpportunity(item);
        var data = ko.toJS(item);

        self.ownersLoadMessage("Loading owners...");

        $.get("/refermatter/owners/" + self.context["appname"] + "/" + parseInt(data.CompanyID) ,function(result){

            if(result.success && result.data){

                var mapped = $.map(result.data, function(o) {

                    console.log(o);
                    var owner = new Owner(0);

                    return owner;

                });

                self.owners(mapped);

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

    self.getNotes = function(item){

        self.notes([]);

        self.notesLoadMessage("Loading notes...");

        var data = {
            appname : self.context["appname"],
            cid: item.ContactID()
        };

        var payload = {
            url: "/prospects/notes",
            method: "POST",
            data: data,
            success: function(response) {

                if (response.success) {

                    var mapped = $.map(response.data, function(item) {

                        var note = new Note(item);
                        note.init(self.context["appname"]);
                        return note;
                    });

                    self.notes(mapped);

                    if(self.notes().length < 1){
                        self.notesLoadMessage("No notes found...");
                    }

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




}
