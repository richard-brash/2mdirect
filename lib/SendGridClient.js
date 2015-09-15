/**
 * Created by richardbrash on 9/15/15.
 */


var isclient = require('../lib/InfusionsoftApiClient');
var mustache = require('mustache');


var SendGridClient = function(){

    this.SendEmail = function(appname, sendGridConfig, emailtemplateId, toEmail, fromEmail, view, callback){

        //  Define the delimiter
        var delimiter = "{{=~ ~=}}";

            // Get the email template
            isclient.Caller(appname, "APIEmailService.getEmailTemplate",[emailtemplateId], function(error, emailTemplate){

                if(error){
                    callback(error, null);
                }else{

                    // Prepare the template
                    var htmlTemplate = delimiter.concat(emailTemplate.htmlBody);
                    var htmlBody = mustache.to_html(htmlTemplate, view);

                    var textTemplate = delimiter.concat(emailTemplate.textBody);
                    var textBody = mustache.to_html(textTemplate, view);

                    var subjectTemplate = delimiter.concat(emailTemplate.subject);
                    var subject = mustache.to_html(subjectTemplate, view);

                    var sendgrid = require('sendgrid')(sendGridConfig.userName, sendGridConfig.password);
                    var email = new sendgrid.Email();

                    email.addTo(toEmail);
                    email.setFrom(fromEmail);
                    email.setSubject(subject);
                    email.setHtml(htmlBody);
                    email.setText(textBody);

                    //  SEND the email
                    sendgrid.send(email, function(error, result){
                        if(error){
                            callback(error, null);
                        }else {
                            callback(null, result);
                        }
                    });

                }

            });

    }

}





module.exports = new SendGridClient();