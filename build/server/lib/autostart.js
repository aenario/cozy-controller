// Generated by CoffeeScript 1.10.0
var App, Client, async, checkStart, config, controller, couchDBClient, couchDBStarted, couchdbHost, couchdbPort, dsHost, dsPort, errors, fs, getApps, getManifest, isCorrect, log, path, permission, recoverStackApp, retrievePassword, start, startStack;

fs = require('fs');

Client = require('request-json-light').JsonClient;

controller = require('./controller');

permission = require('../middlewares/token');

path = require('path');

App = require('./app').App;

config = require('./conf').get;

log = require('printit')({
  prefix: 'lib:autostart'
});

async = require('async');

dsHost = process.env.DATASYSTEM_HOST || 'localhost';

dsPort = process.env.DATASYSTEM_PORT || 9101;

couchdbHost = process.env.COUCH_HOST || 'localhost';

couchdbPort = process.env.COUCH_PORT || '5984';

couchDBClient = new Client("http://" + couchdbHost + ":" + couchdbPort);


/*
    Check if couchDB is started
        * If couchDB isn't startec check again after 5 secondes
        * Return error after <test> (by default 5) tests
 */

couchDBStarted = function(test, callback) {
  if (test == null) {
    test = 5;
  }
  return couchDBClient.get('/', function(err, res, body) {
    if (err == null) {
      return callback(true);
    } else {
      if (test > 0) {
        return setTimeout(function() {
          return couchDBStarted(test - 1, callback);
        }, 5 * 1000);
      } else {
        return callback(false);
      }
    }
  });
};

isCorrect = function(app) {
  return (app.git != null) && (app.name != null) && (app.state != null) && fs.existsSync(path.join(config('dir_app_bin'), app.name)) && fs.existsSync(path.join(config('dir_app_bin'), app.name, "package.json"));
};


/*
    Return manifest of <app> from database application
 */

getManifest = function(app) {
  app.repository = {
    type: "git",
    url: app.git
  };
  app.name = app.name.toLowerCase();
  return app;
};

errors = {};

retrievePassword = function(app, cb) {
  var clientDS;
  clientDS = new Client("http://" + dsHost + ":" + dsPort);
  clientDS.setBasicAuth('home', permission.get());
  return clientDS.post('request/access/byApp/', {
    key: app._id
  }, function(err, res, access) {
    if ((err == null) && ((access != null ? access[0] : void 0) != null)) {
      return cb(null, access[0].value.token);
    } else {
      if (app.password != null) {
        return cb(null, app.password);
      } else {
        return cb("Can't retrieve application password");
      }
    }
  });
};


/*
    Start all applications (other than stack applications)
        * Recover manifest application from document stored in database
        * If it state is 'installed'
            * Start application
            * Check if application is started
            * Update application port in database
        * else
            * Add application in list of installed application
 */

start = function(appli, callback) {
  var app;
  app = getManifest(appli.value);
  if (isCorrect(app)) {
    return retrievePassword(app, function(err, password) {
      if (err != null) {
        log.error(err);
      } else {
        app.password = password;
      }
      if (app.state === "installed") {
        log.info(app.name + ": starting ...");
        return controller.start(app, function(err, result) {
          var clientDS, requestPath;
          if (err != null) {
            log.error(app.name + ": error");
            log.error(err.toString());
            errors[app.name] = new Error("Application didn't start");
            return controller.addDrone(app, callback);
          } else {
            appli = appli.value;
            appli.port = result.port;
            if (!appli.permissions) {
              password = appli.password;
              delete appli.password;
            }
            clientDS = new Client("http://" + dsHost + ":" + dsPort);
            clientDS.setBasicAuth('home', permission.get());
            requestPath = "data/merge/" + appli._id + "/";
            return clientDS.put(requestPath, appli, function(err, res, body) {
              appli.password = password;
              log.info(app.name + ": started");
              return callback();
            });
          }
        });
      } else {
        app = new App(app);
        return controller.addDrone(app.app, callback);
      }
    });
  } else {
    return callback();
  }
};


/*
    Retrive all applications stored in database
        callback error and applications list
 */

getApps = function(callback) {
  var clientDS, requestPath;
  clientDS = new Client("http://" + dsHost + ":" + dsPort);
  clientDS.setBasicAuth('home', permission.get());
  requestPath = '/request/application/all/';
  return clientDS.post(requestPath, {}, function(err, res, body) {
    if (err != null) {
      return callback(err);
    } else if ((res != null ? res.statusCode : void 0) === 404) {
      return callback(null, []);
    } else {
      return callback(null, body);
    }
  });
};


/*
    Check if application is started
        * Try to request application
        * If status code is not 200, 403 or 500 return an error
        (proxy return 500)
 */

checkStart = function(port, callback) {
  var client;
  client = new Client("http://" + dsHost + ":" + port);
  return client.get("", function(err, res) {
    var ref;
    if (res != null) {
      if ((ref = res.statusCode) !== 200 && ref !== 401 && ref !== 402 && ref !== 302) {
        log.warn("Warning: receives error " + res.statusCode);
      }
      return callback();
    } else {
      return checkStart(port, callback);
    }
  });
};


/*
    Recover stack applications
        * Read stack file
        * Parse file
        * Return error if file stack doesn't exist
            or if isn't in correct json
        * Return stack manifest
 */

recoverStackApp = function(callback) {
  return fs.readFile(config('file_stack'), 'utf8', function(err, data) {
    var error;
    if ((data != null) || data === "") {
      try {
        data = JSON.parse(data);
      } catch (error) {
        log.info("Stack isn't installed");
        return callback("Stack isn't installed");
      }
      return callback(null, data);
    } else {
      log.error("Cannot read stack file");
      return callback("Cannot read stack file");
    }
  });
};


/*
    Start stack application <app> defined in <stackManifest>
        * Check if application is defined in <stackManifest>
        * Start application
        * Check if application is started
 */

startStack = function(stackManifest, app, callback) {
  var err;
  if (stackManifest[app] != null) {
    log.info(app + ": starting ...");
    return controller.start(stackManifest[app], function(err, result) {
      var timeout;
      if ((err != null) || !result) {
        log.error(app + " didn't start");
        log.error(err);
        err = new Error(app + " didn't start");
        return callback(err);
      } else {
        log.info(app + ": checking ...");
        timeout = setTimeout(function() {
          return callback("[Timeout] " + app + " didn't start");
        }, 30000);
        return checkStart(result.port, function() {
          clearTimeout(timeout);
          log.info(app + ": started");
          return setTimeout(function() {
            return callback(null, result.port);
          }, 1000);
        });
      }
    });
  } else {
    err = new Error(app + " isn't installed");
    return callback();
  }
};


/*
    Autostart:
        * Stack application are declared in file stack
            /usr/local/cozy/stack.json by default
        *  Other applications are declared in couchDB
 */

module.exports.start = function(callback) {
  log.info("### AUTOSTART ###");
  return couchDBStarted(5, function(started) {
    var err;
    if (started) {
      log.info('couchDB: started');
      return recoverStackApp(function(err, manifest) {
        if (err != null) {
          return callback();
        } else if (manifest['data-system'] == null) {
          log.info("stack isn't installed");
          return callback();
        } else {
          return startStack(manifest, 'data-system', function(err, port) {
            if (err != null) {
              return callback(err);
            } else {
              dsPort = port;
              return getApps(function(err, apps) {
                if (err != null) {
                  return callback(err);
                }
                return async.eachSeries(apps, start, function(err) {
                  return startStack(manifest, 'proxy', function(err) {
                    if (err != null) {
                      log.error(err);
                    }
                    return startStack(manifest, 'home', function(err) {
                      if (err != null) {
                        log.error(err);
                      }
                      return callback();
                    });
                  });
                });
              });
            }
          });
        }
      });
    } else {
      err = new Error("couchDB isn't started");
      return callback(err);
    }
  });
};
