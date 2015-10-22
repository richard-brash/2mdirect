/**
 * Created by richardbrash on 5/27/15.
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

function Prospect(data){

    var self = this;

    self.Id = ko.observable(data.Id);
    self.Company  = ko.observable(data.Company); //  This is the "Client Company"
    self.FirstName = ko.observable(data.FirstName);
    self.LastName = ko.observable(data.LastName);
    self.Email = ko.observable(data.Email);
    self.JobTitle = ko.observable(data.JobTitle);
    self.Website = ko.observable(data.Website);
    self.LastUpdated = ko.observable(data.LastUpdated);
    self.Phone1 = ko.observable(data.Phone1);
    self.StreetAddress1 = ko.observable(data.StreetAddress1);
    self.StreetAddress2 = ko.observable(data.StreetAddress2);
    self.City = ko.observable(data.City);
    self.State = ko.observable(data.State);
    self.PostalCode = ko.observable(data.PostalCode);
    self.Leadsource = ko.observable(data.Leadsource);
    self._CompanyName = ko.observable(data._CompanyName);
    self._EntityType = ko.observable(data._EntityType);
    self._ParentName = ko.observable(data._ParentName);
    self._UltimateParentName = ko.observable(data._UltimateParentName);
    self._NumberofEmployees = ko.observable(data._NumberofEmployees);
    self.AnnualRevenue = ko.observable((data._AnnualRevenue)?data._AnnualRevenue:data._AnnualRevenue0);
    self._YearEstablished = ko.observable(data._YearEstablished);
    self._CompanyDescription = ko.observable(data._CompanyDescription);
    self._CompanyDescription = ko.observable(data._CompanyDescription);
    self.Score = ko.observable(data.Score);
    self.LinkedIn = ko.observable(data.LinkedIn);
    self._IndustryGroupName = ko.observable(data._IndustryGroupName);
    self._NAICS = ko.observable(data._NAICS);


    self.fullName = ko.computed(function() {
        return self.FirstName() + " " + self.LastName();
    });

    self.flame = ko.computed(function(){

        var score = Math.round((self.Score() * 100)/20);

        if(score > 5){score = 5}

        switch (score){
            case 1:
                return "/images/" +"OneFlame.png";
                break;
            case 2:
                return "/images/" +"TwoFlame.png";
                break;
            case 3:
                return "/images/" +"ThreeFlame.png";
                break;
            case 4:
                return "/images/" +"FourFlame.png";
                break;
            case 5:
                return "/images/" +"FiveFlame.png";
                break;
            default:
                return "/images/" +"ZeroFlame.png";
                break;
        }

    })
}

function Opportunity(data, parent){

    var self = this;

    self.Id = ko.observable(data.Id);
    self.ContactID = ko.observable(data.ContactID);

    self.FirstName = ko.observable(data.FirstName);
    self.LastName = ko.observable(data.LastName);
    self.Email = ko.observable(data.Email);

    self.ContactName = ko.observable(data.FirstName + " " + data.LastName);

    self.OpportunityTitle = ko.observable(data.OpportunityTitle);
    self.StageID = ko.observable(data.StageID);
    self.StageName = ko.observable();

    self.NextActionDate = ko.observable(data.NextActionDate);
    self.NextActionNotes = ko.observable(data.NextActionNotes);

    self.DateCreated = ko.observable(data.DateCreated);
    self.OpportunityOwner = ko.observable(data._OwnerName);
    self.OpportunityOwnerEmail = ko.observable(data._OwnerEmail);

    self.founddata = ko.observable(true);

    self.prospect = ko.observable( new Prospect(data));

    self.initfromsearch = function(appname, cid){

        self.ContactID(cid);

        $.get("opportunity/" + appname + "/" + parseInt(cid) ,function(result){


            if(result.success && result.data && result.data.length > 0){

                parent.foundOpportunityData(true);

                self.founddata(true);

                var opportunity = result.data[0];

                self.OpportunityTitle(opportunity.OpportunityTitle);
                self.Id(opportunity.Id);
                self.NextActionDate(opportunity.NextActionDate);
                self.NextActionNotes(opportunity.NextActionNotes);
                self.DateCreated(opportunity.DateCreated);
                self.OpportunityOwner(opportunity._OwnerName);
                self.OpportunityOwnerEmail(opportunity._OwnerEmail);

                $.get("opportunity/stage/" + appname + "/" + parseInt(opportunity.StageID), function(stage){

                    if(stage.success && stage.data){
                        self.StageName(stage.data.StageName);
                    }

                })


            }

        });

    }

    self.init = function(appname){

        $.get("opportunity/contact/" + appname + "/" + parseInt(self.ContactID()) ,function(contact){


            parent.foundOpportunityData(true);
            self.founddata(true);


            self.FirstName(contact.FirstName);
            self.LastName(contact.LastName);
            self.Email(contact.Email);

            self.ContactName(contact.FirstName + " " + contact.LastName);

            self.prospect(new Prospect(contact));


            $.get("opportunity/stage/" + appname + "/" + parseInt(self.StageID()), function(stage){

                if(stage.success && stage.data){
                    self.StageName(stage.data.StageName);
                }

            })

        });


    }


}

function AppViewModel(context){

    var self = this;

    self.context = context;

    self.opportunities = ko.observableArray([]);
    self.currentPage = ko.observable(1);
    self.itemsToGet = ko.observable(15);
    self.filterText = ko.observable("");
    self.filters = ko.observable("");

    self.selectedOpportunity = ko.observable();
    self.foundOpportunityData = ko.observable(false);

    self.notes = ko.observableArray([]);
    self.notesLoadMessage = ko.observable("");

    $('html').bind('keypress', function (e) {
        if (e.keyCode == 13) {
            self.getContacts();
            return false;
        }
    });

    self.resetPage = function() {
        // Fires when filterText changes
        self.currentPage(1);
    };

    self.movePrevious = function(e) {
        var currentPage = self.currentPage();
        var newCurrent = currentPage - 1;
        newCurrent = (newCurrent < 1) ? 1 : newCurrent;

        self.currentPage(newCurrent);
        self.doSearch();

        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();

    };

    self.moveNext = function(e) {
        if (self.contacts().length >= self.itemsToGet()) {
            var currentPage = self.currentPage();
            currentPage++;
            self.currentPage(currentPage);
            self.doSearch();
        }

        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();

    };

    self.showNotes = function(item){
        self.selectedOpportunity(item);
        self.getNotes(item);
    }

    self.updateOpportunity = function(item){


        var opportunity = ko.toJS(item);

        console.log(opportunity);
        console.log(context);

        $.get("/opportunity/afteractionul/" + self.context["appname"], function(data){

            var url = data.afterActionURL + "?email=" + opportunity.Email + "&lastname=" + opportunity.LastName + "&firstname=" + opportunity.FirstName + "&opid=" + opportunity.Id + "&recorderid=" + self.context["cid"];

            var win = window.open(url, '_blank');
            if(win){
                //Browser has allowed it to be opened
                win.focus();
            }else{
                //Broswer has blocked it
                alert('Please allow popups for this site');
            }

        });

    }

    self.getContacts = function(){

        var filters = self.filterText().split(" ");
        var firstName = filters[0];
        var lastName = (filters.length > 1) ? filters[1] : "";

        self.filters(ko.toJSON([{ field: "FirstName", value: firstName }, { field: "LastName", value: lastName }]));

        self.doSearch();
    };

    self.getCompanies = function(){

        self.filters(ko.toJSON([{ field: "_CompanyName", value: self.filterText() }]));

        self.doSearch();

    };

    self.doSearch = function() {

        self.opportunities([]);
        self.foundOpportunityData(false);

        var currentPage = self.currentPage();
        var itemsToGet = self.itemsToGet();

        var data = {
            appname : self.context["appname"],
            cid: self.context["cid"],
            skip: currentPage,
            take: itemsToGet,
            filters: self.filters()
        };

        var payload = {
            url: "/opportunities/search",
            method: "POST",
            data: data,
            success: function(response) {

                if (response.success) {

                    var mapped = $.map(response.data, function(item) {

                        var opportunity = new Opportunity(item, self);
                        opportunity.initfromsearch(self.context["appname"], item.Id);
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

    };

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

    var initalLoad = function(){

        var data = {
            appname : self.context["appname"],
            cid: self.context["cid"]
        };

        var payload = {
            url: "/opportunities/list",
            method: "POST",
            data: data,
            success: function(response) {

                if (response.success) {


                    var mapped = $.map(response.data, function(item) {

                        var opportunity = new Opportunity(item, self);
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
