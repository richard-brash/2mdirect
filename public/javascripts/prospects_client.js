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

        if(typeof(num) == "undefined"){
            num = 0;
            return '$' + (num.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') );
        } else{
            return '$' + (num.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') );
        }

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

ko.bindingHandlers.datepicker = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        //initialize datepicker with some optional options
        var options = {
            format: 'DD/MM/YYYY HH:mm',
            defaultDate: valueAccessor()()
        };

        if (allBindingsAccessor() !== undefined) {
            if (allBindingsAccessor().datepickerOptions !== undefined) {
                options.format = allBindingsAccessor().datepickerOptions.format !== undefined ? allBindingsAccessor().datepickerOptions.format : options.format;
            }
        }

        $(element).datetimepicker(options);

        //when a user changes the date, update the view model
        ko.utils.registerEventHandler(element, "dp.change", function (event) {
            var value = valueAccessor();
            if (ko.isObservable(value)) {
                value(event.date);
            }
        });

        var defaultVal = $(element).val();
        var value = valueAccessor();
        value(moment(defaultVal, options.format));
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var thisFormat = 'MM/DD/YYYY HH:mm';

        if (allBindingsAccessor() !== undefined) {
            if (allBindingsAccessor().datepickerOptions !== undefined) {
                thisFormat = allBindingsAccessor().datepickerOptions.format !== undefined ? allBindingsAccessor().datepickerOptions.format : thisFormat;
            }
        }

        var value = valueAccessor();
        var unwrapped = ko.utils.unwrapObservable(value());

        if (unwrapped === undefined || unwrapped === null) {
            element.value = new moment(new Date());
            console.log("undefined");
        } else {
            element.value = unwrapped.format(thisFormat);
        }
    }
};

$(document).ready(function(){

    var vm = new AppViewModel(getUrlVars());
    ko.applyBindings(vm);

});



function Note(data){

    var self = this;
    self.Id = ko.observable(data.Id);
    self.UserID = ko.observable(data.UserID);
    self.UserName = ko.observable(data.UserName);
    self.CreationDate = ko.observable(data.CreationDate);
    self.CreationNotes = ko.observable((data.CreationNotes) ? data.CreationNotes : "[No Notes]" );
    self.ActionDescription = ko.observable(data.ActionDescription);
    self._NoteRecorder = ko.observable(data._NoteRecorder);

    self.showMe = ko.observable(true);

    self.init = function(appname){

        //if(self.CreationNotes() == "[No Notes]"){
        //    self.showMe(false);
        //}

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

                if(result.success && result.data != null){
                    self.UserName(result.data.FirstName + " " + result.data.LastName);
                } else {

                    if(typeof(self._NoteRecorder()) != "undefined" && self._NoteRecorder() != ""){
                        self.UserName(self._NoteRecorder());
                    } else {
                        self.UserName("Marketing");
                    }


                }

            });
        }
    }


}

function Owner(data){

    var self = this;

    self.name = ko.observable((typeof(data.FirstName) == "undefined") ? data.name : data.FirstName + " " + data.LastName);
    self.email = ko.observable((typeof(data.Email) == "undefined") ? data.email : data.Email);
    self.Id = ko.observable(data.Id);
    self.added = ko.observable(false);

}

function Opportunity(data, context){
    var self = this;

    console.log(data);
    self.context =  context;
    self.OpportunityTitle = ko.observable(data.OpportunityTitle);
    self.ContactID = ko.observable(data.ContactID);

    self._CompanyID = ko.observable(data._CompanyID);
    self.NextActionDate = ko.observable(data.NextActionDate);

    self.NextActionNotes = ko.observable(data.NextActionNotes);
    self.noteValidationMessage = ko.observable("You must enter something into this note field");
    self.showNoteValidation = ko.observable(false);
    self.noteUpdate = function(){
        self.showNoteValidation(false);
    }


    self._OwnerCID = ko.observable(data._OwnerCID);
    self._OwnerName = ko.observable(data._OwnerName);
    self._OwnerEmail = ko.observable(data._OwnerEmail);

    self.newOwner = ko.observable();
    self.ownerValidationMessage = ko.observable("You must select an owner for this Opportunity");
    self.showOwnerValidation = ko.observable(false);


    self.owners = ko.observableArray([]);

    self.ownerChanged = function(){

        self._OwnerCID(self.newOwner().Id());
        self._OwnerName(self.newOwner().name());
        self._OwnerEmail(self.newOwner().email());

        self.showOwnerValidation(false);
    }


    self.saveOpportunity = function(){

        var data = ko.toJS(self);

        if( typeof (data.NextActionNotes) == "undefined"){
            self.showNoteValidation(true);
        }

        if( typeof (data.newOwner) == "undefined"){
            self.showOwnerValidation(true);
        }

        if(self.showNoteValidation() == false && self.showOwnerValidation() == false){


            var postData = {
                appname : self.context["appname"],
                cid: self.context["cid"],
                ContactID: data.ContactID,
                OpportunityTitle: data.OpportunityTitle,
                _CompanyID : data._CompanyID,
                NextActionDate: data.NextActionDate.format("YYYY-MM-DD HH:mm:ss"),
                NextActionNotes: data.NextActionNotes,
                _OwnerCID: data._OwnerCID,
                _OwnerName: data._OwnerName,
                _OwnerEmail: data._OwnerEmail
            };

            var payload = {
                url: "/prospects/opportunity",
                method: "POST",
                data: postData,
                success: function(response) {
                    console.log(response);
                    if (response.success) {

                        toastr.success("Opportunity Created!");
                        $("#opportunityDetails").modal('hide');

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

    $.get("/refermatter/owners/" + context["appname"] + "/" + parseInt(data._CompanyID) ,function(result){

        if(result.success && result.data){

            var mapped = $.map(result.data, function(o) {
                var owner = new Owner(o);
                return owner;

            });

            self.owners(mapped);

        }

    });



}

function Prospect(data){

    var self = this;

    self.Id = ko.observable(data.Id);
    self.Company  = ko.observable(data.Company); //  This is the "Client Company"
    self.CompanyID  = ko.observable(data.CompanyID); //  This is the "Client Company"
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

    if((typeof(data._AnnualRevenue0) == "undefined") && (typeof(data._AnnualRevenue) == "undefined")){
        self.AnnualRevenue = ko.observable(0);
    } else {
        self.AnnualRevenue = ko.observable((data._AnnualRevenue) ? data._AnnualRevenue : data._AnnualRevenue0);
    }

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

function AppViewModel(context){

    var self = this;

    self.context = context;
    self.contacts = ko.observableArray([]);
    self.currentPage = ko.observable(1);
    self.itemsToGet = ko.observable(15);
    self.filterText = ko.observable("");
    self.filters = ko.observable("");
    self.insidesales = ko.observable(false);

    self.selectedProspect = ko.observable();
    self.opportunity = ko.observable();
    self.notes = ko.observableArray([]);
    self.notesLoadMessage = ko.observable("");
    self.initialLoad = ko.observable(true);

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

    self.selectProspect = function(item){
        self.selectedProspect(item);
        self.getNotes(item);
    }

    self.createOpportunity = function(item){

        var data = ko.toJS(item);

        var opportunity = {
            ContactID: data.Id,
            OpportunityTitle: data._CompanyName,
            NextActionDate: moment(),
            _CompanyID : data.CompanyID
        }

        self.opportunity(new Opportunity(ko.toJS(opportunity), self.context));

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

        self.initialLoad(false);

        var currentPage = self.currentPage();
        var itemsToGet = self.itemsToGet();

        var data = {
            appname : self.context["appname"],
            cid: self.context["cid"],
            configid : self.context["config"],
            skip: currentPage,
            take: itemsToGet,
            filters: self.filters()
        };

        var payload = {
            url: "/prospects/search",
            method: "POST",
            data: data,
            success: function(response) {

                if (response.success) {

                    var mapped = $.map(response.data, function(item) {

                        return new Prospect(item);
                    });
                    self.contacts(mapped);


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
            cid: item.Id()
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

        if(self.context["config"]){
            var data = {
                appname : self.context["appname"],
                cid: self.context["cid"],
                configid : self.context["config"]
            };

            var payload = {
                url: "/prospects/savedsearch",
                method: "POST",
                data: data,
                success: function(response) {

                    if (response.success) {

                        var mapped = $.map(response.data, function(item) {

                            return new Prospect(item);
                        });
                        self.contacts(mapped);

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
        } else {

            self.insidesales(true);

            $.get("/prospects/byid/" + self.context["appname"] + "/" + self.context["prospectid"], function(response){

                if (response.success) {

                    self.contacts(new Prospect(response.data));

                } else {
                    toastr.error(response.error);
                }

            })


        }




    }();


}
