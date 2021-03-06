/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *

This is a very simple buffer for a predetermined set of events. It is unbounded.
It forwards all arguments to any outlet emitter attached with sync().

Example:
    var source = new Stream()
      , dest = new EventEmitter()
      , buff = new EventBuffer(source)
      , data = '';
    dest.on('data', function(d) { data += d; });
    source.writeable = true;
    source.readable = true;
    source.emit('data', 'abcdef');
    source.emit('data', '123456');
    buff.sync(dest);

*/

var EventBuffer = function (src, events) {
  // By default, we service the default stream events
  var self = this
    , streamEvents = ['data', 'end', 'error', 'close', 'fd', 'drain', 'pipe'];
  this.events = events || streamEvents;
  this.emitter = src;
  this.eventBuffer = [];
  this.outlet = null;
  this.events.forEach(function (name) {
    self.emitter.addListener(name, function () {
      self.proxyEmit(name, arguments);
    });
  });
};

EventBuffer.prototype = new (function () {
  this.proxyEmit = function (name, args) {
    if (this.outlet) {
      this.emit(name, args);
    }
    else {
      this.eventBuffer.push({name: name, args: args});
    }
  };

  this.emit = function (name, args) {
    // Prepend name to args
    var outlet = this.outlet;
    Array.prototype.splice.call(args, 0, 0, name);
    outlet.emit.apply(outlet, args);
  };

  // Flush the buffer and continue piping new events to the outlet
  this.sync = function (outlet) {
    var buffer = this.eventBuffer
      , bufferItem;
    this.outlet = outlet;
    while ((bufferItem = buffer.shift())) {
      this.emit(bufferItem.name, bufferItem.args);
    }
  };
})();
EventBuffer.prototype.constructor = EventBuffer;

module.exports.EventBuffer = EventBuffer;
