// Generated by CoffeeScript 1.9.3
var exec, fs, getCouchStoragePlace, getCouchStoragePlaceFromFile, log;

fs = require('fs');

exec = require('child_process').exec;

log = require('printit')({
  date: true,
  prefix: 'cozy-controller'
});

getCouchStoragePlaceFromFile = function(file, callback) {
  var databaseDirLine;
  databaseDirLine = "database_dir";
  return fs.readFile(file, function(err, data) {
    var dir, i, len, line, lines;
    dir = '/';
    if (err == null) {
      lines = data.toString().split('\n');
      for (i = 0, len = lines.length; i < len; i++) {
        line = lines[i];
        if (line.indexOf(databaseDirLine) === 0) {
          dir = line.split('=')[1];
        }
      }
      return callback(null, dir.trim());
    } else {
      return callback(err);
    }
  });
};

getCouchStoragePlace = function(callback) {
  var files, getDir;
  files = ["/usr/local/etc/couchdb/local.ini", "/etc/couchdb/local.ini", "/usr/local/etc/couchdb/default.ini", "/etc/couchdb/default.ini"];
  if (process.env.COUCH_LOCAL_CONFIG) {
    files.unshift(process.env.COUCH_LOCAL_CONFIG);
  }
  return (getDir = function() {
    var file;
    if (files.length === 0) {
      return callback(null, '/');
    } else {
      file = files.shift();
      log.info("Looks for storage info in config file: " + file);
      return getCouchStoragePlaceFromFile(file, function(err, dir) {
        if (err) {
          log.info('File not found.');
          return getDir();
        } else if (dir === '/') {
          log.info('No storage location found.');
          return getDir();
        } else {
          return callback(null, dir);
        }
      });
    }
  })();
};


/*
    Return disk space information
 */

module.exports.info = function(req, res, next) {
  var extractDataFromDfResult, extractValFromDfValue, freeMemCmd;
  freeMemCmd = "free | grep cache: | cut -d':' -f2 | sed -e 's/^ *[0-9]* *//'";
  extractValFromDfValue = function(val) {
    var unit;
    unit = val[val.length - 1];
    val = val.substring(0, val.length - 1);
    val = val.replace(',', '.');
    if (unit === 'M') {
      val = "" + (parseFloat(val) / 1000);
    }
    if (unit === 'T') {
      val = "" + (parseFloat(val) * 1000);
    }
    return val;
  };
  extractDataFromDfResult = function(dir, resp) {
    var currentMountPoint, data, defaultData, freeSpace, freeUnit, i, len, line, lineData, lines, totalSpace, totalUnit, usedSpace, usedUnit;
    data = null;
    defaultData = {};
    lines = resp.split('\n');
    currentMountPoint = '';
    for (i = 0, len = lines.length; i < len; i++) {
      line = lines[i];
      line = line.replace(/[\s]+/g, ' ');
      lineData = line.split(' ');
      if (lineData.length > 5 && (lineData[5] === '/' || dir.indexOf(lineData[5]) !== -1)) {
        totalSpace = lineData[1].substring(0, lineData[1].length - 1);
        usedSpace = lineData[2].substring(0, lineData[2].length - 1);
        freeSpace = lineData[3].substring(0, lineData[3].length - 1);
        totalUnit = lineData[1].slice(-1);
        usedUnit = lineData[2].slice(-1);
        freeUnit = lineData[3].slice(-1);
        if (lineData[5] === '/') {
          defaultData.totalDiskSpace = totalSpace;
          defaultData.freeDiskSpace = freeSpace;
          defaultData.usedDiskSpace = usedSpace;
          defaultData.totalUnit = totalUnit;
          defaultData.usedUnit = usedUnit;
          defaultData.freeUnit = freeUnit;
          defaultData.dir = '/usr/local/var/lib/couchdb';
          defaultData.mount = '/';
        } else if (dir.indexOf(lineData[5]) === 0) {
          data = {};
          data.totalDiskSpace = totalSpace;
          data.freeDiskSpace = freeSpace;
          data.usedDiskSpace = usedSpace;
          data.unit = unit;
          data.dir = dir;
          data.mount = lineData[5];
        }
      }
    }
    return data || defaultData;
  };
  return getCouchStoragePlace(function(err, dir) {
    return exec("df -h " + dir, function(err, resp) {
      var data;
      if (err) {
        return res.send(500, err);
      } else {
        data = extractDataFromDfResult(dir, resp);
        log.info("Disk usage information: " + (JSON.stringify(data)));
        return res.send(200, data);
      }
    });
  });
};
