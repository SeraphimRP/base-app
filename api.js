// Instead of creating it as an independent app,
// we use it as an attachment to our currently existing app.
var express = require("express");
var router = express.Router();
var app = require('./app');

// This way, we're able to use the data properly as JSON.
var bodyParser = require("body-parser");

// Modules relating to user accounts
var sha512 = require("js-sha512").sha512;
var validator = require("validator");
var crypto = require("crypto");
var profanity = require("profanity-util");
var request = require("request");

var debugMode = process.env.DEBUG_MODE;

//var captchaSecret = process.env.CAPTCHA_SECRET;
var apiKey = process.env.API_KEY;

// check if the api key is valid, otherwise deny ANY functionality
if (sha512(apiKey) != "2e1874bb631386c9ceb63be7bbf6eadb232f68b9ad11ef136a9297f7d4d4fb6b9daf92fa53a61e9b92ffdf37a0defca09f5a91243b427fb96350f6c480005611") {
    return { error: 401, text: "you shall not use this api" };
}

// see if this fixes the db issues
var db;
router.use(function (req, res, next) {
    db = req.db;
    next();
});

// Ensure that the previously mentioned module is hooked in.
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

// backend functions
function isReserved(username) {
    // development usage only
    if (username.includes("test") || username.includes("bot")) {
        return true;
    }

    // profanity checks
    if (profanity.check(username).length != 0) {
        return true;
    }

    if (username.includes("fuck") || username.includes("fag") ||
        username.includes("nig")  || username.includes("fek") ||
        username.includes("fuk")) {
        return true;
    }

    return false;
}

function databaseInsert(username, password, email, joinDate, salt, ip) {
    // inserts the data into the database, no kidding, right?
    // returns: boolean

    // create a json object based on the values
    var data = {"username": username, "password": password, "email": email, "joinDate": joinDate, "salt": salt, "ip": ip};

    db.collection("users").insertOne(data, function (err, doc) {
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
    if (data.password != data.confirmpass) { res.json({ok: false, text: "Your password and confirmation password do not match."}); return; }
    if (data.email != data.confirmemail) { res.json({ok: false, text: "Your email and confirmation email do not match."}); return; }

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
    /*var v = {"Content-Type":"application/x-www-form-urlencoded"}
    var y = {"secret":process.env.CAPTCHA_SECRET,"response":captcha};
    var p = {url:"https://www.google.com/recaptcha/api/siteverify",method:"POST",headers:v,form:y};
    var r = request(p,function(h,e,k){if(!h&&e.statusCode==200){return k;}});*/

    // checks the database if the email and/or the username already exists
    db.collection("users").find({$or: [{ "username": username }, { "email": email }]}).toArray(function (err, docs) {
        // if cases handling what happens as a result of the data;
        if (isReserved(username)) {
            res.json({ok: false, text: "This username is reserved."});
        } else if (docs.length != 0) {
            usernameOrEmail = (username === docs[0].username ? "username" : "email");
            switch (usernameOrEmail) {
                case "username":
                    res.json({ok: false, text: "This username is already in our database, contact support if you need to recover your account."});
                    break;
                case "email":
                    res.json({ok: false, text: "This email is already in our database, contact support if you need to recover your account."});
                    break;
            }
        } else if (username.indexOf(" ") >= 0) {
            res.json({ok: false, text: "You cannot have whitespace in your username, sorry."});
        } else if (!validator.isEmail(email)) {
            res.json({ok: false, text: "Please use a valid email address."});
        } else if (!debugMode && r.success != true) {
            res.json({ok: false, text: "You cannot signup until you have completed the CAPTCHA correctly."});
        } else {
            if (!databaseInsert(username, password, email, joinDate, salt, ip)) {
                res.json({ok: false, text: "For some reason, we have failed to create your account. If this problem persists, please contact support and include this information:" + joinDate.toString()});
            } else {
                res.json({ok: true, text: "Account created successfully, you may now login."});
            }
        }
    });
});

router.post("/login", function (req, res) {
    var data = req.body;

    // for some reason, i need this, i don't know why
    var tempLanguage = globalLanguage;

    var username = validator.escape(data.username);

    db.collection("users").find({ "username": username }).toArray(function (err, docs) {
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

router.get("/id/:id", function (req, res) {
    // an api call for pulling the data of the user, will be used later, ignore for now
    res.set("Content-Type", "application/json");

    db.collection("users").find({ _id: req.params.id }).toArray(function (err, result) {
        res.send(JSON.stringify(result[0]));

        if (err != null) {
            return {"id lookup err": err.toString()};
        }
    });
});

module.exports = router;
