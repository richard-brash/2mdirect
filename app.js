var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var sendgrid = require('./routes/sendgrid');
var registerclick = require('./routes/registerclick');
var event = require('./routes/event');
var unsubscribe = require('./routes/unsubscribe');
var dashboard = require('./routes/dashboard');
var prospects = require('./routes/prospects');
var opportunities = require('./routes/opportunities');
var opportunity = require('./routes/opportunity');
var refermatter = require('./routes/refermatter');
var referralcompass = require('./routes/referralcompass');
var infusionsoftuser = require('./routes/infusionsoftuser');
var update = require('./routes/update');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/sendgrid', sendgrid);
app.use('/registerclick', registerclick);
app.use('/event', event);
app.use('/unsubscribe', unsubscribe);
app.use('/dashboard', dashboard);
app.use('/prospects', prospects);
app.use('/opportunities', opportunities);
app.use('/opportunity', opportunity);
app.use('/refermatter', refermatter);
app.use('/referralcompass', referralcompass);

app.use('/infusionsoftuser', infusionsoftuser);
app.use('/update', update);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
