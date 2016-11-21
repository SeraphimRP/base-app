# Retejo.me
[![Build Status](https://travis-ci.org/retejo/legacy.svg?branch=master)](https://travis-ci.org/retejo/legacy)

A web hosting service for Esperanto speakers.

--

Note:
======

This code will no longer be updated, unless repurposed later, all pull requests will be closed and the Travis-CI build will most likely fail because it can't connect to the redis server that we originally had.

--

How to Contribute
===================

Code:

* Use 4 spaces for indentation.
* Make sure all your commits are put into the "development" branch, if we were to merge your PR.
* Make sure it passes all tests. (npm test and the Travis-CI job) (note: if the Travis-CI fails because it timed out, then restart the job)
* Make sure that your contribution is something proposed or in development in the [issues](https://github.com/retejo/retejo.me/issues) or the [Beta Testing roadmap](https://github.com/retejo/retejo.me/projects/1).

--

Translations:

* Make sure all your commits are put into the "development" branch, if we were to merge your PR.
* Make sure that there is accuracy in your translation, proper grammar (use formal words, if applicable), no phrases left out, that sorta thing.
* You can base your translations on any of the existing translations, as these are approved.
* Make sure the file is in the i18n folder and named "<language>.json"
* If you wanna put in the extra mile, put the proper code to load the language into i18n.js, however, this is not required.
* Make sure that the "_name" value exists with the English translation of your language's name in all lowercase.

--

Suggestions:

* Provide examples and concept designs (if applicable)
