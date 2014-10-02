// Generated by CoffeeScript 1.8.0
var App, conf, config, fs, initAppsFiles, initDir, initFiles, initTokenFile, mkdirp, oldConfig, patch, path, permission, randomString;

fs = require('fs');

permission = require('./middlewares/token');

App = require('./lib/app').App;

conf = require('./lib/conf');

config = require('./lib/conf').get;

oldConfig = require('./lib/conf').getOld;

path = require('path');

mkdirp = require('mkdirp');

patch = require('./lib/patch');

randomString = function(length) {
  var string;
  if (length == null) {
    length = 32;
  }
  string = "";
  while (string.length < length) {
    string += Math.random().toString(36).substr(2);
  }
  return string.substr(0, length);
};


/*
    Initialize source directory
        * Create new directory
        * Remove old directory if necessary
 */

initDir = (function(_this) {
  return function(callback) {
    var newDir, oldDir;
    newDir = config('dir_source');
    oldDir = oldConfig('dir_source');
    return mkdirp(newDir, function(err) {
      if (err != null) {
        return callback(err);
      } else {
        if (oldDir) {
          fs.renameSync(path.join(oldDir, "stack.json"), path.join(newDir, "stack.json"));
        }
        return callback();
      }
    });
  };
})(this);


/* 
    Initialize source code directory and stack.json file
 */

initAppsFiles = (function(_this) {
  return function(callback) {
    console.log('init: source directory');
    return initDir(function(err) {
      var stackFile;
      if (err != null) {
        callback(err);
      }
      console.log('init: stack file');
      stackFile = config('file_stack');
      if (oldConfig('file_stack')) {
        return fs.rename(oldConfig('file_stack'), stackFile, callback);
      } else {
        if (!fs.existsSync(stackFile)) {
          return fs.open(stackFile, 'w', callback);
        } else {
          return callback();
        }
      }
    });
  };
})(this);


/*
    Init stack token stored in '/etc/cozy/stack.token'
 */

initTokenFile = (function(_this) {
  return function(callback) {
    var tokenFile;
    console.log("init : token file");
    tokenFile = config('file_token');
    if (tokenFile === '/etc/cozy/stack.token' && !fs.existsSync('/etc/cozy')) {
      fs.mkdirSync('/etc/cozy');
    }
    if (fs.existsSync(tokenFile)) {
      fs.unlinkSync(tokenFile);
    }
    return fs.open(tokenFile, 'w', function(err, fd) {
      if (err) {
        return callback("We cannot create token file. " + "Are you sure, token file configuration is a good path ?");
      } else {
        return fs.chmod(tokenFile, '0600', function(err) {
          var token;
          if (err != null) {
            callback(err);
          }
          token = randomString();
          return fs.writeFile(tokenFile, token, function(err) {
            permission.init(token);
            return callback(err);
          });
        });
      }
    });
  };
})(this);


/* 
    Initialize files :
        * Initialize stack file and directory of source code
        * Initialize log files
        * Initialize token file
 */

initFiles = (function(_this) {
  return function(callback) {
    return initAppsFiles(function(err) {
      if (err != null) {
        return callback(err);
      } else {
        return mkdirp('/var/log/cozy', function(err) {
          if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
            return initTokenFile(callback);
          } else {
            return callback();
          }
        });
      }
    });
  };
})(this);


/* 
    Initialize files :
        * Initialize configuration
        * Initialize files
        * Rewrite file configuration
 */

module.exports.init = (function(_this) {
  return function(callback) {
    var initialize;
    console.log("### FILE INITIALIZATION ###");
    initialize = function() {
      return conf.init(function(err) {
        if (err) {
          return callback(err);
        } else {
          return initFiles(function(err) {
            conf.backupConfig();
            return callback(err);
          });
        }
      });
    };
    if (!fs.existsSync('/etc/cozy/.patch')) {
      return patch.apply(function() {
        return initialize();
      });
    } else {
      return initialize();
    }
  };
})(this);
