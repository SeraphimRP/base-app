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

var app = module.exports = express();

// settings
var host = "0.0.0.0";
var port = (process.env.PORT || 5555);

app.use(sessions(process.env.REDIS_URL, process.env.COOKIE_SECRET));

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
        return;
    }

    // Save database object from the callback for reuse.
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

// frontend routes
app.get('/', function (req, res) {
    let data = createDataObject(req);
    res.render('home', data);
});

app.get('/debug', function (req, res) {
    res.json(req.session);
});

app.get('/login', function (req, res) {
    let data = createDataObject(req);
    res.render('login', data);
});

app.get('/signup', function (req, res) {
    let data = createDataObject(req);
    res.render('signup', data);
});

app.get('/profile/:id', function (req, res) {
    // TODO
});

function createDataObject(req) {
    if (req.session.user && req.session.user.username) {
        return req.session.user;
    } else {
        return { "empty": true };
    }
}