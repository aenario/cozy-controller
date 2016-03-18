// Generated by CoffeeScript 1.10.0
var BASE_PACKAGE_JSON, config, createAppFolder, directory, executeUntilEmpty, fs, log, path;

path = require('path');

fs = require('fs');

directory = require('./directory');

executeUntilEmpty = require('../helpers/executeUntilEmpty');

config = require('./conf').get;

log = require('printit')({
  date: true,
  prefix: 'lib:npm-installer'
});

BASE_PACKAGE_JSON = "{\n  \"name\": \"cozy-controller-fake-package.json\",\n  \"version\": \"1.0.0\",\n  \"description\": \"This file is here to please NPM\",\n  \"README\":  \"This file is here to please NPM\",\n  \"license\": \"N/A\",\n  \"repository\": \"N/A\"\n}";

createAppFolder = function(app, callback) {
  var dirPath, packagePath;
  dirPath = path.join(config('dir_app_bin'), app.name);
  packagePath = path.join(dirPath, 'package.json');
  return fs.mkdir(dirPath, "0711", function(err) {
    if (err) {
      return callback(new Error("Failed to create folder " + dirPath + " : " + err.message));
    }
    return fs.writeFile(packagePath, BASE_PACKAGE_JSON, 'utf8', function(err) {
      if (err) {
        return callback(new Error("Failed to create package.json " + packagePath + " : " + err.message));
      }
      return directory.changeOwner(app.user, dirPath, function(err) {
        if (err) {
          return callback(new Error("Failed to changeOwner " + dirPath + " : " + err.message));
        }
        return callback(null, dirPath);
      });
    });
  });
};


/*
    Initialize repository of <app>
        * Run npm install <app> in the apps dir
 */

module.exports.init = function(app, callback) {
  var ref;
  if (!((ref = app["package"]) != null ? ref.name : void 0)) {
    return callback(new Error("Tried to npm_installer.init a non NPM app : " + (JSON.stringify(app))));
  }
  return createAppFolder(app, function(err, appFolder) {
    var commands, opts;
    if (err) {
      return callback(err);
    }
    commands = [['npm', 'install', app.fullnpmname]];
    opts = {
      user: app.user,
      cwd: appFolder
    };
    return executeUntilEmpty(commands, opts, function(err) {
      if (err != null) {
        log.error(err);
        log.error("FAILLED TO RUN CMD", err);
        return callback(err);
      } else {
        return callback();
      }
    });
  });
};


/*
    Update repository of <app>
        * Run npm install <app> in the apps dir
 */

module.exports.update = function(app, callback) {
  var commands, opts;
  commands = [['npm', 'install', app.fullnpmname]];
  opts = {
    user: app.user,
    cwd: config('dir_app_bin')
  };
  return executeUntilEmpty(commands, opts, function(err) {
    if (err) {
      log.error(err);
      return log.error("failed to remove app");
    } else {
      return callback();
    }
  });
};


/*
    Change branch of <app>
        * Run npm install <app>@<newBranch> in the apps dir
 */

module.exports.changeBranch = function(app, newBranch, callback) {
  var commands, newFullName, opts;
  newFullName = app["package"].name + "@" + app["package"].version;
  commands = [['npm', 'install', newFullName]];
  opts = {
    cwd: config('dir_app_bin'),
    user: app.user
  };
  return executeUntilEmpty(commands, opts, function(err) {
    if (err) {
      log.error(err);
      return log.error("failed to remove app");
    } else {
      app["package"].version = newBranch;
      return callback();
    }
  });
};
