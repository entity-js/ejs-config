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

var path = require('path'),
    fs = require('fs'),
    os = require('os'),
    test = require('unit.js'),
    Config = require('../lib');

describe('ejs/config', function () {

  'use strict';

  var tmpPath = path.join(
        os.tmpdir(), 'entityjs-tests--config--' + process.pid
      );

  describe('Config.has()', function () {

    it('hasShouldReturnFalseIfPropertyDoesntExist', function () {

      var config = new Config();

      test.bool(
        config.has('test')
      ).isNotTrue();

    });

    it('hasShouldFindTheFirstLevelPropertyOfSingleLevel', function () {

      var config = new Config();
      config._config.test = 'hello';

      test.bool(
        config.has('test')
      ).isTrue();

    });

    it('hasShouldFindTheFirstLevelPropertyOfMultiLevel', function () {

      var config = new Config();
      config._config.test = {value: 'hello'};

      test.bool(
        config.has('test')
      ).isTrue();

    });

    it('hasShouldFindTheSecondLevelPropertyOfMultiLevel', function () {

      var config = new Config();
      config._config.test = {value: 'hello'};

      test.bool(
        config.has('test.value')
      ).isTrue();

    });

  });

  describe('Config.get()', function () {

    it('getWillReturnNullIfItDoesntExist', function () {

      var config = new Config();

      test.value(
        config.get('test')
      ).isNull();

    });

    it('getWillReturnTheDefaultValueIfItDoesntExist', function () {

      var config = new Config();

      test.bool(
        config.get('test', false)
      ).isNotTrue();

    });

    it('getTheFirstLevelPropertyOfSingleLevel', function () {

      var config = new Config();
      config._config.test = 'value';

      test.string(
        config.get('test')
      ).is('value');

    });

    it('getTheFirstLevelPropertyOfMultiLevel', function () {

      var config = new Config();
      config._config.test = {value: 'hello'};

      test.object(
        config.get('test')
      ).is({'value': 'hello'});

    });

    it('getTheSecondLevelPropertyOfMultiLevel', function () {

      var config = new Config();
      config._config.test = {value: 'hello'};

      test.string(
        config.get('test.value')
      ).is('hello');

    });

  });

  describe('Config.set()', function () {

    it('setValue', function () {

      var config = new Config();

      config.set('test', 'hello');
      test.object(
        config._config
      ).is({
        'test': 'hello'
      });

    });

    it('setMultiLevelValue', function () {

      var config = new Config();

      config.set('test.value', 'hello');
      test.object(
        config._config
      ).is({
        'test': {
          'value': 'hello'
        }
      });

    });

  });

  describe('Config.del()', function () {

    it('delValue', function () {

      var config = new Config();
      config._config.test = 'hello';

      config.del('test');
      test.object(
        config._config
      ).is({});

    });

    it('delAMultiValue', function () {

      var config = new Config();
      config._config.test = {'value': 'hello'};

      config.del('test');
      test.object(
        config._config
      ).is({});

    });

    it('delAMultiValueValue', function () {

      var config = new Config();
      config._config.test = {'value': 'hello'};

      config.del('test.value');
      test.object(
        config._config
      ).is({
        'test': {}
      });

    });

  });

  describe('Config.save()', function () {

    beforeEach(function () {

      fs.mkdirSync(tmpPath);

    });

    afterEach(function () {

      if (fs.existsSync(path.join(tmpPath, 'config.json'))) {
        fs.unlinkSync(path.join(tmpPath, 'config.json'));
      }

      if (fs.existsSync(path.join(tmpPath, 'config2.json'))) {
        fs.unlinkSync(path.join(tmpPath, 'config2.json'));
      }

      fs.rmdirSync(path.join(tmpPath));

    });

    it('savesAnEmptyConfigFile', function (done) {

      var config = new Config(path.join(tmpPath, 'config.json'));

      config.save(function (err) {

        test.value(err).isNull();
        test.bool(
          fs.existsSync(config._filename)
        ).isTrue();

        done();

      });

    });

    it('savesPopulatedConfig', function (done) {

      var config = new Config(path.join(tmpPath, 'config.json'));
      config._config.test = {value: 'hello'};

      config.save(function (err) {

        test.value(err).isNull();

        test.object(
          JSON.parse(
            fs.readFileSync(config._filename)
          )
        ).is(config._config);

        done();

      });

    });

    it('savesConfigWithReferences', function (done) {

      var config = new Config(path.join(tmpPath, 'config.json'));
      config._config.test = {value: 'hello'};
      config._config.test2 = {value: 'world'};

      config._references = {
        'test2': path.join(tmpPath, 'config2.json')
      };

      config.save(function (err) {

        test.value(err).isNull();

        test.object(
          JSON.parse(
            fs.readFileSync(config._filename)
          )
        ).is({
          'test': {'value': 'hello'},
          'test2': '@{config2.json}'
        });

        test.object(
          JSON.parse(
            fs.readFileSync(path.join(tmpPath, 'config2.json'))
          )
        ).is({'value': 'world'});

        done();

      });

    });

    it('throwsAnErrorIfUnableToSave', function (done) {

      var config = new Config(path.join('/etc', 'config.json'));

      config.save(function (err) {

        test.value(
          err
        ).isInstanceOf(Error);

        done();

      });

    });

  });

  describe('Config.restore()', function () {

    beforeEach(function () {

      fs.mkdirSync(tmpPath);
      fs.writeFileSync(path.join(tmpPath, 'config.json'), JSON.stringify({
        'test': {'value': 'hello'}
      }));

    });

    afterEach(function () {

      fs.unlinkSync(path.join(tmpPath, 'config.json'));
      if (fs.existsSync(path.join(tmpPath, 'config2.json'))) {
        fs.unlinkSync(path.join(tmpPath, 'config2.json'));
      }

      fs.rmdirSync(path.join(tmpPath));

    });

    it('errorIsThrownIfTheConfigDoesntExist', function (done) {

      var config = new Config(path.join(tmpPath, 'config2.json'));

      config.restore(function (err) {

        test.error(
          err
        ).isInstanceOf(Error);

        done();

      });

    });

    it('restoreFromConfigFile', function (done) {

      var config = new Config(path.join(tmpPath, 'config.json'));

      config.restore(function (err) {

        test.value(err).isNull();

        test.object(
          config._config
        ).is({
          'test': {'value': 'hello'}
        });

        done();

      });

    });

    it('restoreFromConfigFileResetsExistingConfig', function (done) {

      var config = new Config(path.join(tmpPath, 'config.json'));
      config._config.hello = 'world';

      config.restore(function (err) {

        test.value(err).isNull();
        test.object(
          config._config
        ).is({
          'test': {'value': 'hello'}
        });

        done();

      });

    });

    it('restoreFromReferences', function (done) {

      fs.writeFileSync(path.join(tmpPath, 'config.json'), JSON.stringify({
        'test': {'value': 'hello'},
        'test2': '@{config2.json}'
      }));

      fs.writeFileSync(path.join(tmpPath, 'config2.json'), JSON.stringify({
        'value': 'world'
      }));

      var config = new Config(path.join(tmpPath, 'config.json'));

      config.restore(function (err) {

        test.value(err).isNull();

        test.object(
          config._references
        ).is({
          'test2': path.join(tmpPath, 'config2.json')
        });

        test.object(
          config._config
        ).is({
          'test': {'value': 'hello'},
          'test2': {'value': 'world'}
        });

        done();

      });

    });

    it('throwsAnErrorIfTheConfigFileIsNotValidJSON', function (done) {

      fs.writeFileSync(path.join(tmpPath, 'config.json'), 'test');

      var config = new Config(path.join(tmpPath, 'config.json'));

      config.restore(function (err) {

        test.value(
          err
        ).isInstanceOf(Error);

        done();

      });

    });

  });

});
