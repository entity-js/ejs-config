/**
 *  ______   __   __   ______  __   ______  __  __
 * /\  ___\ /\ "-.\ \ /\__  _\/\ \ /\__  _\/\ \_\ \
 * \ \  __\ \ \ \-.  \\/_/\ \/\ \ \\/_/\ \/\ \____ \
 *  \ \_____\\ \_\\"\_\  \ \_\ \ \_\  \ \_\ \/\_____\
 *   \/_____/ \/_/ \/_/   \/_/  \/_/   \/_/  \/_____/
 *                                         __   ______
 *                                        /\ \ /\  ___\
 *                                       _\_\ \\ \___  \
 *                                      /\_____\\/\_____\
 *                                      \/_____/ \/_____/
 */

/**
 * Provides the Config class allowing access to the EntityCMS config.
 *
 * @author Orgun109uk <orgun109uk@gmail.com>
 *
 * @module ejs
 * @submodule Config
 */

var path = require('path'),
    fs = require('fs'),
    async = require('async'),
    data = require('ejs-data');

/**
 * The internal config object.
 *
 * @private
 * @property {Object} _config
 * @for Config
 */

/**
 * Pointers between config groups and object references.
 *
 * @private
 * @property {Object} _references
 * @for Config
 */

/**
 * The Config class providing methods to access the config options.
 *
 * @class Config
 * @construct
 */
function Config(filename) {
  'use strict';

  Object.defineProperty(this, '_filename', {value: filename});
  this._config = {};
  this._references = {};
  this._data = data(this._config);
}

/**
 * Determines if the provided property exists.
 *
 * @example
 *   config._config = {test: {hello: 'world'}}
 *
 *   config.has('test') = TRUE
 *   config.has('test.hello') = TRUE
 *   config.has('world') = FALSE
 *
 * @method has
 * @param {String} name The name of the property to check.
 * @return {Boolean} Returns true or false.
 */
Config.prototype.has = function (name) {
  'use strict';

  return this._data.has(name);
};

/**
 * Get the value of the property, or the default value.
 *
 * @example
 *   config._config = {test: {hello: 'world'}}
 *
 *   config.get('test') = {hello: 'world'}
 *   config.get('test.hello') = 'world'
 *   config.get('world') = null
 *   config.get('world', 'hello') = 'hello'
 *
 * @method get
 * @param {String} name The name of the property to get.
 * @param {Mixed} [def=null] The default value to return if the property
 *   doesnt exist.
 * @return {Mixed} Returns the property value, otherwise the def value.
 */
Config.prototype.get = function (name, def) {
  'use strict';

  return this._data.get(name, def);
};

/**
 * Set the value of a property.
 *
 * @method set
 * @param {String} name The name of the property to set.
 * @param {Mixed} value The value to assign.
 * @return {Config} Returns self.
 * @chainable
 */
Config.prototype.set = function (name, value) {
  'use strict';

  this._data.set(name, value);
  return this;
};

/**
 * Deletes the value of a property.
 *
 * @method del
 * @param {String} name The name of the property to delete.
 * @return {Config} Returns self.
 * @chainable
 */
Config.prototype.del = function (name) {
  'use strict';

  this._data.del(name);
  return this;
};

/**
 * Saves the config file.
 *
 * @method save
 * @param {Function} done The done callback.
 *   @param {Error} done.err An error object if anything occured during saving.
 */
Config.prototype.save = function (done) {
  'use strict';

  var me = this;

  function buildConfigs() {
    var configs = {};

    if (Object.keys(me._references).length === 0) {
      configs[me._filename] = me._config;
    } else {
      var cfg = me._config;
      for (var reference in me._references) {
        var filename = path.relative(
          path.dirname(me._filename),
          me._references[reference]
        );

        configs[
          path.join(path.dirname(me._filename), filename)
        ] = cfg[reference];

        cfg[reference] = '@{' + filename + '}';
      }

      configs[me._filename] = cfg;
    }

    return configs;
  }

  var cfgs = buildConfigs(),
      queue = [];

  function writeFile(fname, d) {
    return function (next) {
      fs.writeFile(fname, JSON.stringify(d), next);
    };
  }

  for (var config in cfgs) {
    queue.push(writeFile(config, cfgs[config]));
  }

  async.series(queue, function (err) {
    done(err === undefined ? null : err);
  });
};

/**
 * Restores the config object from the config file.
 *
 * @method restore
 * @param {Function} done The done callback.
 *   @param {Error} done.err An error object if anything occured during restore.
 */
Config.prototype.restore = function (done) {
  'use strict';

  var me = this;

  function includeFile(n) {
    if (
      me._config[n].indexOf('@{') === 0 &&
      me._config[n].lastIndexOf('}') === me._config[n].length - 1
    ) {
      var cfgFilename = path.join(
        path.dirname(me._filename),
        me._config[n].substr(2, me._config[n].length - 3)
      );

      if (fs.existsSync(cfgFilename)) {
        me._references[n] = cfgFilename;
        me._config[n] = JSON.parse(fs.readFileSync(cfgFilename));
      }
    }
  }

  fs.readFile(this._filename, function (err, d) {
    if (err) {
      return done(err);
    }

    try {
      me._config = JSON.parse(d);
      for (var n in me._config) {
        if (typeof me._config[n] !== 'string') {
          continue;
        }

        includeFile(n);
      }

      done(null);
    } catch (e) {
      done(e);
    }
  });
};

/**
 * Exports the Config constructor.
 */
module.exports = Config;
