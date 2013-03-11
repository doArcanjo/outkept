var sys = require('sys'),
  events = require('events'),
  util = require('util');

var Sensor = function (connection, conf) {
  this.connection = connection;
  this.conf = conf;
};

sys.inherits(Sensor, events.EventEmitter);

Sensor.prototype.check = function () {
  var self = this;

  if (!this.conf.verifier || this.conf.verifier === '') {
    this.emit('available');
  } else {
    this.connection.exec(self.conf.verifier, function (err, stream) {
      if (err) { throw err; }
      stream.on('data', function (data, extended) {
        if (extended !== 'stderr') {
          if (data.toString('utf-8').indexOf("yes") !== -1) {
            self.emit('available');
          } else {
            self.emit('notavailable');
          }
        }
      });
    });
  }
};

Sensor.prototype.run = function () {
  var self = this;
  this.interval = setInterval(function () { self.worker(); }, 10000);
};

Sensor.prototype.stop = function () {
  clearInterval(this.interval);
};

Sensor.prototype.worker = function () {
  var self = this;

  this.connection.exec(this.conf.cmd, function (err, stream) {
    if (err) { throw err; }
    stream.on('data', function (data, extended) {
      self.value = data.toString('utf-8');
      if (self.conf.reactive && ((self.value > self.conf.alarm && !self.conf.inverted) || (self.value < self.conf.alarm && self.conf.inverted))) {
        this.connection.exec(self.conf.reactive);
        console.log('Sensor ' + self.conf.name + ' fired!');
      }
    });
  });
};

module.exports = Sensor;