/**
 * Created by richardbrash on 5/27/15.
 */

$(document).ready(function(){

    ko.applyBindings(new AppViewModel(data));
})


function DataRow(row){

    var self = this;

    self.Company  = ko.observable(row.Company);
    self.PhoneWithExtension1 = ko.observable(row.PhoneWithExtension1);
    self.Email = ko.observable(row.Email);
    self.JobTitle = ko.observable(row.JobTitle);
    self.Website = ko.observable(row.Website);
    self.Lastupdated = ko.observable(row.Lastupdated);
    self.Custom_CompanyName = ko.observable(row.Custom_CompanyName);
    self.Custom_NumberofEmployees = ko.observable(row.Custom_NumberofEmployees);
    self.Custom_AnnualRevenue0 = ko.observable(row.Custom_AnnualRevenue0);
    self.Custom_ScoreLegacy = ko.observable(row.Custom_ScoreLegacy);

    self.details = ko.computed(function() {

        return self.Custom_NumberofEmployees() + " " + self.Custom_AnnualRevenue0() + " " + self.Custom_ScoreLegacy();

    });

}

function AppViewModel(data){

    var self = this;
    self.dataRows = ko.observableArray();
    self.pageSize = ko.observable(10);
    self.pageIndex = ko.observable(0);
    self.previousPage = function() {
        self.pageIndex(self.pageIndex() - 1);
    },
    self.nextPage = function() {
        self.pageIndex(self.pageIndex() + 1);
    }

    var mapped = $.map(data, function(item) {
        return new DataRow(item)
    });
    self.dataRows(mapped);


    self.maxPageIndex = ko.dependentObservable(function() {
        return Math.ceil(self.dataRows().length / self.pageSize()) - 1;
    });

    self.pagedRows = ko.dependentObservable(function() {
        var size = self.pageSize();
        var start = self.pageIndex() * size;
        return self.dataRows.slice(start, start + size);
    });

}


//div.col-xs-1(data-bind="text:Custom_NumberofEmployees")
//div.col-xs-1(data-bind="text:Custom_AnnualRevenue0")
//div.col-xs-1(data-bind="text:Custom_ScoreLegacy")
