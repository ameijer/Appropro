/**
 * @Date:   2017-01-15T22:06:07-05:00
 * @Filename: app.js
* @Last modified time: 2017-01-29T17:57:29-05:00
 * @License: Distributed under the MIT license: https://opensource.org/licenses/MIT
 * @Copyright: Copyright (c) 2017 Alex Meijer and Aidan Hoolachan
 */



var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var ConnectRoles = require('connect-roles');
var helmet = require('helmet');
var csrf = require('csurf');
var Agenda = require('agenda');
var Promise = require('bluebird');
var deepPopulate = require('mongoose-deep-populate')(mongoose);
var multiparty = require('multiparty');

var app = express();
app.deepPopulate = deepPopulate;
app.multiparty = multiparty;

app.db = mongoose.createConnection('mongodb://node_client:noddr.JS@localhost:27017/appropro_obj?ssl=true&sslValidate=false');
require('../schema/StatusLog')(app, mongoose);
require('../schema/Note')(app, mongoose);

var User = require('../schema/User')(app, mongoose);

require('./models/MessageForAdmins')(app, mongoose);
require('../schema/Admin')(app, mongoose);
require('../schema/AdminGroup')(app, mongoose);
require('../schema/Account')(app, mongoose);
require('../schema/AppropSettings')(app, mongoose);
require('../schema/Workflow')(app, mongoose);
require('../schema/WorkflowStep')(app, mongoose);
require('./models/LetterItem')(app, mongoose);
require('../schema/CongressionalOffice')(app, mongoose);
require('../schema/Subcommittee')(app, mongoose);

app.etherClient = require('./ether/etherClient');


var roleUser = new ConnectRoles({
    failureHandler: function(req, res, action) {
        // optional function to customise code that runs when
        // user fails authorisation
        var accept = req.headers.accept || '';
        res.status(403);
        if (~accept.indexOf('html')) {
            res.render('access-denied', {
                action: action
            });
        } else {
            res.send('Access Denied - You don\'t have permission to: ' + action);
        }
    }
});

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment when we place favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '50mb'
}));
app.use(cookieParser('hi'));

var url = 'mongodb://127.0.0.1:27017/appropro_obj';

var o = {
    server: {
        ssl: true,
        sslValidate: false,
        //      sslKey: key,
        //      sslCert:key
        // socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 }
    },

    user: '<redacted>',
    pass: '<redacted>'
};

mongoose.Promise = Promise;

app.mongoose = mongoose;

// Use connect method to connect to the Server
mongoose.connect(url, o, function(err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
        //We are connected. :)
        console.log('Mongoose connection established to', url);
    }

});

//this is set to have a 30 minute cookie. delete the maxage member to get a session cookie
app.use(session({
    cookie: {
        domain: '.appropro.co',
        expires: new Date(253402300000000)
    },
    resave: true,
    saveUninitialized: true,
    secret: 'hi',
    rolling: true,
    store: new mongoStore({
        mongooseConnection: mongoose.connection
    })
}));

app.use(express.static(path.join(__dirname, '../static/public')));
// Configure passport middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    app.db.models.User.findOne({
        _id: id
    }).populate('roles.admin').populate('roles.account').populate('office').exec(function(err, user) {
        if (user && user.roles && user.roles.admin) {
            user.roles.admin.populate("groups", function(err, admin) {
                done(err, user);
            });
        } else {
            done(err, user);
        }
    });
});


//role config

//everybody
roleUser.use(function(req, action) {
    if (!req.isAuthenticated()) return false; // action === 'access home page';
});

//admin users can access all pages
roleUser.use(function(req) {
    return true;
});

roleUser.use('access manager page', function(req) {
    return true;
});

roleUser.use('manage office users', function(req) {
    return true;
});

roleUser.use('change office staff roles', function(req) {
    return true;
});

// Register routes
app.use(require('./routes')({
    'roleUser': roleUser,
    'app': app
}));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err); //res.redirect('/manage' + req.originalUrl);
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
app.utility = {};
app.utility.workflow = require('../drywall/util/workflow');

module.exports = app;
