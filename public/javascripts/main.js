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
    self.CreationDate = ko.observable(data.CreationDate);
    self.CreationNotes = ko.observable(data.CreationNotes);
    self.ActionDescription = ko.observable(data.ActionDescription);
    self.showMe = ko.observable(false);

    self.toggleMe = function () { self.showMe(!self.showMe()) };
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

    self._CompanyName = ko.observable(data._CompanyName);
    self._EntityType = ko.observable(data._EntityType);
    self._ParentName = ko.observable(data._ParentName);
    self._UltimateParentName = ko.observable(data._UltimateParentName);
    self._NumberofEmployees = ko.observable(data._NumberofEmployees);
    self._AnnualRevenue0 = ko.observable(data._AnnualRevenue0);
    self._YearEstablished = ko.observable(data._YearEstablished);
    self._CompanyDescription = ko.observable(data._CompanyDescription);
    self._ScoreLegacy = ko.observable(data._ScoreLegacy);

    self.fullName = ko.computed(function() {
        return self.FirstName() + " " + self.LastName();
    });
}

function AppViewModel(context){

    var self = this;

    self.context = context;

    self.contacts = ko.observableArray([]);
    self.currentPage = ko.observable(1);
    self.itemsToGet = ko.observable(15);
    self.filterText = ko.observable("");
    self.filters = ko.observable("");

    self.selectedProspect = ko.observable();
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
            url: "/dashboard/search",
            method: "POST",
            data: data,
            success: function(response) {

                if (response.success) {

                    var mapped = $.map(response.data, function(item) {
                        return new Prospect(item);
                    });
                    self.contacts(mapped);


                } else {
                    toastr.error(response.Message);
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
            cid: item.Id
        };

        var payload = {
            url: "/dashboard/notes",
            method: "POST",
            data: data,
            success: function(response) {

                if (response.success) {


                    var mapped = $.map(response.data, function(item) {
                        return new Note(item);
                    });

                    self.notes(mapped);

                    if(self.notes().length < 1){
                        self.notesLoadMessage("No notes found...");
                    }

                } else {
                    toastr.error(response.Message);
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
            cid: self.context["cid"],
            configid : self.context["config"]
        };

        var payload = {
            url: "/dashboard/savedsearch",
            method: "POST",
            data: data,
            success: function(response) {

                if (response.success) {

                    var mapped = $.map(response.data, function(item) {
                        return new Prospect(item);
                    });
                    self.contacts(mapped);

                } else {
                    toastr.error(response.Message);
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
