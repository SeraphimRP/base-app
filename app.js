require('newrelic');
var chalk = require('chalk');
var express = require('express');
var hbs = require('hbs');

// session-related things
var sessions = require('./sessions');

// database stuff
var mongodb = require('mongodb');
var db;

// use the api routes and the i18n handler
var api = require('./api');
var i18n = require('./i18n');

var app = express();

// settings
var host = "0.0.0.0";
var port = (process.env.PORT || 5555);

// the secret will be process.env.COOKIE_SECRET
// but for now, we're just gonna use a test one
app.use(sessions(process.env.REDIS_URL, process.env.COOKIE_SECRET));

// ensure that a language is set for every session
// and pull the language ahead of time, saving us some
// calls to i18n.getLanguage()
var language;
app.use(function(req, res, next) {
    if (typeof req.session.language === "undefined") {
        i18n.changeLanguage(req.session);
    }

    language = i18n.getLanguage(req.session.language);

    next();
});

app.use(function (req, res, next) {
    req.db = db;
    next();
});

// ensure that handlebars is the view engine on express' end
app.set('view engine', 'hbs');
app.set('views', __dirname + '/v');
hbs.registerPartials(__dirname + '/v/part');

mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
    if (err) {
        console.log(err);
        return {ok: false, text: "failed to connect to the database"};
    }

    db = database;

    app.listen(port, host, function () {
        console.log(chalk.bold.cyan('Server started on ' +
                                    chalk.bold.green(host + ':' + port) + '.'));

        app.emit("appStarted");
    });
});

app.use('/api', api); // make sure the api routes are hooked up and working at /api

// load the assets into their proper folder so the templates run smoothly
app.use('/js',express.static(__dirname + '/assets/js'));
app.use('/css',express.static(__dirname + '/assets/css'));
app.use('/img',express.static(__dirname + '/assets/img'));
app.use('/browserconfig.xml',express.static(__dirname + '/assets/browserconfig.xml'));
app.use('/manifest.json',express.static(__dirname + '/assets/manifest.json'));

// letsencrypt verification
app.use('/.well-known',express.static(__dirname + '/assets/.well-known'));

// frontend routes
app.get('/', function (req, res) {
    language.PG_TITLE = language.PG_HOME;

    if (req.session.user && req.session.user.username) {
        language.name = req.session.user.username;
        language.user = req.session.user;
    } else if (req.session.user === undefined) {
        language.name = req.ip;
        language.user = "";
    }

    res.render('home', language);
});

app.get('/debug', function (req, res) {
    res.json(req.session);
});

app.get('/about', function (req, res) {
    language.PG_TITLE = language.PG_ABOUT;

    if (req.session.user && req.session.user.username) {
        language.user = req.session.user;
    } else if (req.session.user === undefined) {
        language.user = "";
    }

    res.render('about', language);
});

app.get('/directory', function (req, res) {
    language.PG_TITLE = language.PG_DIRECTORY;

    if (req.session.user && req.session.user.username) {
        language.user = req.session.user;
    } else if (req.session.user === undefined) {
        language.user = "";
    }

    res.render('directory', language);
});

app.get('/contact', function (req, res) {
    language.PG_TITLE = language.PG_CONTACT;

    if (req.session.user && req.session.user.username) {
        language.user = req.session.user;
    } else if (req.session.user === undefined) {
        language.user = "";
    }

    res.render('contact', language);
});

app.get('/login', function (req, res) {
    language.PG_TITLE = language.PG_LOGIN;

    if (req.session.user && req.session.user.username) {
        language.user = req.session.user;
    } else if (req.session.user === undefined) {
        language.user = "";
    }

    res.render('login', language);
});

app.get('/signup', function (req, res) {
    language.PG_TITLE = language.PG_SIGNUP;

    if (req.session.user && req.session.user.username) {
        language.user = req.session.user;
    } else if (req.session.user === undefined) {
        language.user = "";
    }

    res.render('signup', language);
});

app.get('/profile/:id', function (req, res) {
    // TODO
});

exports.getDB = function () {
    return db;
}

module.exports = app;
