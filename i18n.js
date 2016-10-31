// this file will mainly handle the translations
// the files in i18n are just translation files, nothing more
var english = require("./i18n/english.json");
var esperanto = require("./i18n/esperanto.json");
var french = require("./i18n/french.json");
var portuguese = require("./i18n/portuguese.json");
var russian = require("./i18n/russian.json");
var spanish = require("./i18n/spanish.json");
var ukrainian = require("./i18n/ukrainian.json");

var i18n = {
    english: english,
    esperanto: esperanto,
    french: french,
    portuguese: portuguese,
    russian: russian,
    spanish: spanish,
    ukrainian: ukrainian,
    defaultLanguage: english,
    changeLanguage: function(session, language) {
        switch (language) {
            case english.name:
                session.language = english;
                break;
            case esperanto.name:
                session.language = esperanto;
                break;
            case french.name:
                session.language = french;
                break;
            case portuguese.name:
                session.language = portuguese;
                break;
            case russian.name:
                session.language = russian;
                break;
            case spanish.name:
                session.language = spanish;
                break;
            case ukrainian.name:
                session.language = ukrainian;
        }
    }
}

module.exports = i18n;
