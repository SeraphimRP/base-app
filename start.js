var chalk = require('chalk');
var app = require('./app');
var api = require('./api');

// settings
var host = "0.0.0.0";
var port = 5555;
var server = app;

// https stuff (uncomment for production)
/*
    var fs = require('fs');
    var https = require('https');
    var chain = fs.readFileSync('/etc/letsencrypt/live/retejo.me/fullchain.pem');
    var privateKey = fs.readFileSync('/etc/letsencrypt/live/retejo.me/privkey.pem');
    var server = https.createServer({key: privateKey, cert: chain}, app);
*/

// houston, we have lift off
server.listen(port, host, function () {
    console.log(chalk.bold.cyan('Server started on ' +
                                chalk.bold.green(host + ':' + port) + '.'));
});
