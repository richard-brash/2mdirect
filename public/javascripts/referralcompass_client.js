/**
 * Created by richardbrash on 9/16/15.
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

$(document).ready(function(){

    ko.applyBindings(new AppViewModel(getUrlVars()));

})

function Group(data){
    var self = this;
    self.GroupName = ko.observable(data.GroupName);
    self.GroupDescription = ko.observable(data.GroupDescription);
    self.Id = ko.observable(data.Id);
    self.checked = ko.observable(false);
}

function Category(data){
    var self = this;
    self.CategoryName = ko.observable(data.CategoryName);
    self.Id = ko.observable(data.Id);

}

function CategorySection(data){
    var self = this;
    self.Category = ko.observable(new Category(data.Category));

    self.Groups = ko.observableArray([]);

    self.setAll = function(item){

        ko.utils.arrayForEach(item.Groups(), function(group){
            group.checked(!group.checked());
        });

    };

    var mapped = $.map(data.Groups, function(item) {

        return new Group(item);

    });

    self.Groups(mapped);

}

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
    self.groupName = ko.observable(data.groupName);


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

    self.prospects = ko.observableArray([]);
    self.selectedProspect = ko.observable();

    self.notes = ko.observableArray([]);
    self.notesLoadMessage = ko.observable("");


    self.categorySections = ko.observableArray([]);
    self.showcriteria = ko.observable(true);

    self.toggleSearch = function(){
        self.showcriteria(!self.showcriteria());
    }

    $('html').bind('keypress', function (e) {
        if (e.keyCode == 13) {
//            self.getContacts();
            return false;
        }
    });

    self.dosearch = function(){

        self.showcriteria(false);
        self.prospects.removeAll();

        ko.utils.arrayForEach(self.categorySections(), function(categorySection){

            ko.utils.arrayForEach(categorySection.Groups(), function(group){

                if(group.checked()){

                    $.get("prospects/withtag/" + self.context["appname"] + "/" + parseInt(self.context["cid"]) + "/" + parseInt(group.Id()), function(response){

                        if (response.success) {

                            var mapped = $.map(response.data, function(item) {

                                var prospect = new Prospect(item);
                                prospect.groupName(categorySection.Category().CategoryName() + "->" + group.GroupName());
                                self.prospects.push(prospect);
                                return null;
                            });

                        } else {
                            toastr.error(response.error);
                        }

                    })


                }


            })

        })

    };

    self.selectProspect = function(item){
        self.selectedProspect(item);
        self.getNotes(item);
    }

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

    self.getCategorySections = function() {

        var payload = {
            url: "/referralcompass/tags/" + self.context["appname"],
            method: "GET",
            success: function(response) {

                if (response.success) {

                    var mapped = $.map(response.data, function(item) {
                        return new CategorySection(item);

                    });

                    self.categorySections(mapped);


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
