var expressSession = require('express-session');
var RedisStore = require('connect-redis')(expressSession);

module.exports = function Sessions(url, cookie_secret) {
  var store = new RedisStore({ url: url });
  var session = expressSession({
    secret: cookie_secret,
    store: store,
    resave: true,
    saveUninitialized: true,
    cookie: {
        path: '/',
        httpOnly: true,
        maxAge: 365 * 24 * 3600 * 1000 // a week long session
    },
  });

  return session;
};
