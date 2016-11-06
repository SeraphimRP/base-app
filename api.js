// Instead of creating it as an independent app,
// we use it as an attachment to our currently existing app.
var express = require("express");
var router = express.Router();
var app = require('./app');

// Import languages
var i18n = require("./i18n");

// This way, we're able to use the data properly as JSON.
var bodyParser = require("body-parser");

// Modules relating to user accounts
var sha512 = require("js-sha512").sha512;
var validator = require("validator");
var crypto = require("crypto");
var profanity = require("profanity-util");
var request = require("request");

var debugMode = true;

var captchaSecret = process.env.CAPTCHA_SECRET;
var apiKey = process.env.API_KEY;

// check if the api key is valid, otherwise deny ANY functionality
if (sha512(apiKey) != "f727a23af0ec14964264f4b5b4662c7fd765e9e6404eb52f720609fe3521cdf8f7fe6c819d7396050149272edf6ce0723e18eccbc3b2eb2310a677e835b033f0") {
    return { error: 401, text: "you shall not use this api" };
}

// pull the language ahead of time, saving us on
// a billion calls to i18n.getLanguage()
var globalLanguage;
router.use(function (req, res, next) {
    if (typeof req.session.language === "undefined") {
        i18n.changeLanguage(req.session);
    }

    globalLanguage = i18n.getLanguage(req.session.language);
    next();
});

// Ensure that the previously mentioned module is hooked in.
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

// backend functions
function isReserved(username) {
    // pretty self explanitory, checks if the username is reserved
    // returns: boolean
    var reservedUsernames = [ "evildea", "zamenhof", "admin", "owner", "staff", "team",
                              "vypr", "itwango", "stupiddroid", "moderator", "amuzulo",
                              "mod", "administrator", "support" ];

    // development usage only
    /*
        if (username.includes("test") || username.includes("retejo")) {
            return true;
        }
    */

    // profanity checks
    if (profanity.check(username).length != 0) {
        return true;
    }

    if (username.includes("fuck") || username.includes("fag") ||
        username.includes("nig")  || username.includes("fek") ||
        username.includes("fuk")) {
        return true;
    }

    // check if the username is one of the prereserved names
    for (var i = 0; i < reservedUsernames.length; i++) {
        if (username == reservedUsernames[i]) {
            return true;
        }
    }

    return false;
}

function databaseInsert(username, password, email, joinDate, salt, ip) {
    // inserts the data into the database, no kidding, right?
    // returns: boolean

    // create a json object based on the values
    var data = {"username": username, "password": password, "email": email, "joinDate": joinDate, "salt": salt, "ip": ip};

    app.db.collections("users").insertOne(data, function (err, doc) {
        if (err) {
            return false;
        }
    });

    return true;
}

// login/signup routes
router.post("/signup", function (req, res) {
    // the sign up function
    // tl;dr - user creates an account, this makes sure everything is good
    // and if it is, allows it and saves it to the database
    var data = req.body;

    // makes sure that they match, so that way people don"t mess up accidentally
    if (data.password != data.confirmpass) { res.json({ok: false, text: globalLanguage.RSP_SIGNUP_UNMATCH_PASS}); return; }
    if (data.email != data.confirmemail) { res.json({ok: false, text: globalLanguage.RSP_SIGNUP_UNMATCH_EMAIL}); return; }

    // escape every input, hash the password (with a random salt), and create a join date
    var salt = crypto.randomBytes(16).toString("hex");

    var username = validator.escape(data.username);
    var password = sha512(validator.escape(data.password) + salt);
    var email = validator.escape(data.email);
    var joinDateObject = new Date();
    var joinDate = joinDateObject.getTime();
    var ip = req.ip;
    var captcha = data.captcha;

    // just verify that the captcha was fine on google's end
    // shouldn't ever need to touch this
    var v = {"Content-Type":"application/x-www-form-urlencoded"}
    var y = {"secret":process.env.CAPTCHA_SECRET,"response":captcha};
    var p = {url:"https://www.google.com/recaptcha/api/siteverify",method:"POST",headers:v,form:y};
    var r = request(p,function(h,e,k){if(!h&&e.statusCode==200){return k;}});

    // checks the database if the email and/or the username already exists
    app.db.collections("users").find({$or: [{ "username": username }, { "email": email }]}).toArray(function (err, docs) {
        // if cases handling what happens as a result of the data;
        if (isReserved(username)) {
            res.json({ok: false, text: globalLanguage.RSP_SIGNUP_USER_RESERVED});
        } else if (docs.length != 0) {
            usernameOrEmail = (username === docs[0].username ? "username" : "email");
            switch (usernameOrEmail) {
                case "username":
                    res.json({ok: false, text: globalLanguage.RSP_SIGNUP_USER_USED});
                    break;
                case "email":
                    res.json({ok: false, text: globalLanguage.RSP_SIGNUP_EMAIL_USED});
                    break;
            }
        } else if (username.indexOf(" ") >= 0) {
            res.json({ok: false, text: globalLanguage.RSP_SIGNUP_USER_NOWHTSPC});
        } else if (!validator.isEmail(email)) {
            res.json({ok: false, text: globalLanguage.RSP_SIGNUP_INVALID_EMAIL});
        } else if (!debugMode && r.success != true) {
            res.json({ok: false, text: globalLanguage.RSP_SIGNUP_INVALID_CAPTCHA});
        } else {
            if (!databaseInsert(username, password, email, joinDate, salt, ip)) {
                res.json({ok: false, text: globalLanguage.RSP_SIGNUP_ERROR + joinDate.toString()});
            } else {
                res.json({ok: true, text: globalLanguage.RSP_SIGNUP_SUCCESS});
            }
        }
    });
});

router.post("/login", function (req, res) {
    var data = req.body;

    // for some reason, i need this, i don't know why
    var tempLanguage = globalLanguage;

    var username = validator.escape(data.username);

    app.db.collections("users").find({ "username": username }).toArray(function (err, docs) {
        if (docs.length != 0) {
            if (docs[0] != username) { // so the usernames have to be exact
                var queryResult = docs[0];
                var password = sha512(validator.escape(data.password) + queryResult.salt);

                if (password != queryResult.password) {
                    res.json({ok: false, text: globalLanguage.RSP_LOGIN_PASSWORD_ERROR});
                } else {
                    // save the language so that way it doesn't change
                    // when regeneration happens
                    var languageName = req.session.language;
                    var globalLanguage = i18n.getLanguage(languageName);

                    // regenerate to avoid session fixation
                    req.session.regenerate(function() {
                        req.session.user = queryResult;
                        req.session.language = languageName;

                        res.json({ok: true, text: globalLanguage.RSP_LOGIN_SUCCESS});
                    });
                }
            } else {
                res.json({ok: false, text: tempLanguage.RSP_LOGIN_USERNAME_ERROR});
            }
        } else {
            res.json({ok: false, text: tempLanguage.RSP_LOGIN_USERNAME_ERROR});
        }
    });
});

router.get("/logout", function (req, res) {
    // i would've handled a case where it didn't destroy the session
    // if there was no user logged in, but because of a weird bug
    // i'll allow it anyways, it doesn't change the functionality

    req.session.destroy(function() {
            res.json({ok: true, text: globalLanguage.RSP_HOME_LOGOUT_SUCCESS});
    });
});


// routes that aren't related to any login system
router.post("/change_language", function (req, res) {
    // the api wrapper for i18n.changeLanguage()
    var data = req.body;
    var result = i18n.changeLanguage(req.session, data.language);
    res.json({ok: result});
});

router.get("/id/:id", function (req, res) {
    // an api call for pulling the data of the user, will be used later, ignore for now
    res.set("Content-Type", "application/json");

    app.db.collections("users").find({ _id: req.params.id }).toArray(function (err, result) {
        res.send(JSON.stringify(result[0]));

        if (err != null) {
            return {"id lookup err": err.toString()};
        }
    });
});

module.exports = router;
