// this file will mainly handle the translations
// the files in i18n are just translation files, nothing more
var english = require("./i18n/english.json");
var esperanto = require("./i18n/esperanto.json");
var french = require("./i18n/french.json");
var german = require("./i18n/german.json");
var greek = require("./i18n/greek.json");
var italian = require("./i18n/italian.json");
var polish = require("./i18n/polish.json");
var portuguese = require("./i18n/portuguese.json");
var russian = require("./i18n/russian.json");
var spanish = require("./i18n/spanish.json");
var ukrainian = require("./i18n/ukrainian.json");


var i18n = {
    english: english,
    esperanto: esperanto,
    french: french,
    german: german,
    greek: greek,
    italian: italian,
    polish: polish,
    portuguese: portuguese,
    russian: russian,
    spanish: spanish,
    ukrainian: ukrainian,
    defaultLanguage: english,
    getLanguage: function(language) {
        switch (language) {
            case english._name:
                return this.english;
            case esperanto._name:
                return this.esperanto;
            case french._name:
                return this.french;
            case german._name:
                return this.german;
            case greek._name:
                return this.greek;
            case italian._name:
                return this.italian;
            case polish._name:
                return this.polish;
            case portuguese._name:
                return this.portuguese;
            case russian._name:
                return this.russian;
            case spanish._name:
                return this.spanish;
            case ukrainian._name:
                return this.ukrainian
            default:
                return this.defaultLanguage;
                break;
        }
    },
    changeLanguage: function(session, language) {
        var changed = false;
        switch (language) {
            case english._name:
                session.language = "english";
                changed = true;
                break;
            case esperanto._name:
                session.language = "esperanto";
                changed = true;
                break;
            case french._name:
                session.language = "french";
                changed = true;
                break;
            case german._name:
                session.language = "german";
                changed = true;
                break;
            case greek._name:
                session.language = "greek";
                changed = true;
                break;
            case italian._name:
                session.language = "italian";
                changed = true;
                break;
            case polish._name:
                session.language = "polish";
                changed = true;
                break;
            case portuguese._name:
                session.language = "portuguese";
                changed = true;
                break;
            case russian._name:
                session.language = "russian";
                changed = true;
                break;
            case spanish._name:
                session.language = "spanish";
                changed = true;
                break;
            case ukrainian._name:
                session.language = "ukrainian";
                changed = true;
				break;
            default:
                session.language = "english";
                break;
        }

        return changed;
    }
}

module.exports = i18n;
