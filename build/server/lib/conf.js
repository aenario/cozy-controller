// Generated by CoffeeScript 1.8.0
var conf, fs, oldConf, patch, readFile;

fs = require('fs');

conf = {};

oldConf = {};

patch = "0";


/*
    Read configuration file
        * Use default configuration if file doesn't exist
        * Return error if configuration file is not a correct json
 */

readFile = (function(_this) {
  return function(callback) {
    var data;
    if (fs.existsSync('/etc/cozy/controller.json')) {
      try {
        data = require('/etc/cozy/controller.json');
        data.old = {};
      } catch (_error) {
        callback(null, {});
      }
      if (fs.existsSync('/etc/cozy/.controller-backup.json')) {
        data.old = require('/etc/cozy/.controller-backup.json');
        return callback(null, data);
      } else {
        return callback(null, data);
      }
    } else {
      return callback(null, {});
    }
  };
})(this);


/*
    Initialize configuration
        * Use configuration store in configuration file or default configuration
        * conf : Current configuration
        * oldConf : Old configuration, usefull to move source code between different configurations for example
        * patch : usefull between old and new controller
 */

module.exports.init = (function(_this) {
  return function(callback) {
    return readFile(function(err, data) {
      if (err != null) {
        return callback(err);
      } else {

        /*conf =
            npm_registry :      data.npm_registry or false
            npm_strict_ssl :    data.npm_strict_ssl or false
            dir_log :           data.dir_log or '/var/log/cozy'
            dir_source :        data.dir_source or '/usr/local/cozy/apps'
            file_token :        data.file_token or '/etc/cozy/stack.token'
        conf.file_stack = conf.dir_source + '/stack.json'
        if data.old?.dir_log? and data.old.dir_log isnt conf.dir_log
            oldConf.dir_log = data.old.dir_log 
        else 
            oldConf.dir_log = false
        if data.old?.dir_source? and data.old.dir_source isnt conf.dir_source
            oldConf.dir_source = data.old.dir_source 
        else 
            oldConf.dir_source = false
        if data.old?.file_stack? and data.old.file_stack isnt conf.file_stack
            oldConf.file_stack = data.old.file_stack 
        else 
            oldConf.file_stack = false
         */
        conf = {
          npm_registry: data.npm_registry || false,
          npm_strict_ssl: data.npm_strict_ssl || false,
          dir_log: '/var/log/cozy',
          dir_source: '/usr/local/cozy/apps',
          file_token: '/etc/cozy/stack.token'
        };
        conf.file_stack = conf.dir_source + '/stack.json';
        if (data.env != null) {
          conf.env = {
            global: data.env.global || false,
            "data-system": data.env['data-system'] || false,
            home: data.env.home || false,
            proxy: data.env.proxy || false
          };
        }
        return callback();
      }
    });
  };
})(this);


/*
    Return configuration for <arg>
 */

module.exports.get = (function(_this) {
  return function(arg) {
    return conf[arg];
  };
})(this);


/*
    Return old configuration for <arg>
 */

module.exports.getOld = (function(_this) {
  return function(arg) {
    return oldConf[arg];
  };
})(this);


/*
    Remove Old configuration
        * Rewrite file configuration without old configuration
        * Usefull after changes (move code soource for example)
 */

module.exports.backupConfig = (function(_this) {
  return function() {
    var displayConf;
    displayConf = {
      npm_registry: conf.npm_registry,
      npm_strict_ssl: conf.npm_strict_ssl,
      dir_log: conf.dir_log,
      dir_source: conf.dir_source,
      env: conf.env
    };
    return fs.writeFile("/etc/cozy/controller.json", JSON.stringify(displayConf), function(err) {
      if (err != null) {
        console.log(err);
      }
      return fs.writeFile("/etc/cozy/.controller-backup.json", JSON.stringify(displayConf), function(err) {
        if (err != null) {
          return console.log(err);
        }
      });
    });
  };
})(this);
