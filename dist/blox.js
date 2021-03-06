/*! Blox JS - v0.1.0 - 2013-05-27
* https://github.com/otterthecat/blox.js
* Copyright (c) 2013 Otter the Cat; Licensed MIT, GPL */
(function() {

  // "private" method to load external scripts
  // for any given block
  var loadScript = function(script_path, callback_obj) {

    var newScript = document.createElement('script');
    newScript.type = 'text/javascript';
    newScript.src = script_path;

    newScript.onload = function() {

      callback_obj.fn.call(callback_obj.scope, callback_obj.arg);
    };

    document.getElementsByTagName('body')[0].appendChild(newScript);
  };

  var Blox = function(options){

    // global doc
    this.document = window.document;

    // object to hold paths of imported scripts
    this.includes = {};

    // object to hold user functions
    this.funcs = {};

    // object to hold arguments for same-namespaced "funcs" (optional)
    this.args = {};

    // object to hold variables to be shared across funcs
    this.vars = {};

    // default settings (user configurable)
    this.config = {
      
      devMode: true,
      scripts: [],
      preventVarOverride: true
    };

    // object to hold susbscribing events
    this.subscribers = {};

    // array of of unit testing functions (ignored if config.devMode set to true)
    this.testables = [];

    // collection of helper methods
    this.utils = {

      merge: function(baseObj, addObj) {

        for(var item in addObj) {

          // 'merge' cannot be overridden in this manner,
          // as it is used elsewhere in 'blox_prototype'
          if(item !== 'merge') {

            baseObj[item] = addObj[item];
          } else {

            this.dbug('warn', '[merge] is not replaceable in blox, ignoring %o', item);
          }
        }

        return baseObj;
      },

      // used for simple unit testing of 'funcs' functions
      assert: function(obj) {

        // sample expected format:
        // {inc: '', namespace : '', testValue : '', assertValue : ''}
        if(!this.config.devMode) {

          return null;
        }

        this.dbug('warn', 'Assert [' + obj.namespace + ']: ' + obj.testValue + " === " + obj.assertValue);

        if(obj.testValue === obj.assertValue) {

          this.dbug('info', "PASS : " + obj.testValue + " === " + obj.assertValue);

          return true;
        } else {

          this.dbug('error', "FAIL : " + obj.testValue + " !== " + obj.assertValue);
          return false;
        }
      }
    };

    this.init(options);
  };

  Blox.prototype = {

    // user configurations can be passed
    init: function(settings) {

      if(typeof settings === 'object') {

          this.utils.merge(this.config, settings);
      }

      return this;
    },


    setUtils: function(utilObj) {

      var utils = this.utils;
      utils.merge(utils, utilObj);

      return this;
    },

    // fire 'bblox' to happen on dom load
    // (or page load for lesser browsers)
    launch: function() {

      var _this = this;
      // browser is not inept
      if(this.document.addEventListener) {

          this.document.addEventListener("DOMContentLoaded", function() {

              return _this.exec();

          }, false);

      } else {
          // browser is inept explorer 8 or less
          window.onload = function() {

              return _this.exec();
          };
      }
    },

    // runs through 'funcs' object and call all functions within.
    // will run in tandem with utils.assert() if config.devMode set to true
    exec: function(namespace) {

      // no namespace passed, so loop through them all
      if(!namespace) {

          if(!this.config.devMode) {

              for(var item in this.funcs) {

                  if(this.includes.hasOwnProperty(item) && typeof this.includes[item] === 'string') {

                      var _this = this;
                      loadScript(this.includes[item], {
                          fn: _this.funcs[item],
                          scope: _this,
                          arg:  _this.args[item] || undefined
                      });

                  } else {

                      this.funcs[item].call(this, this.args[item] || undefined);
                  }
              }
          }

          // TODO tidy this block up a bit
          if(this.config.devMode) {

              var t = this.testables;

              for(var i = 0; i < t.length; i++) {

                  var _testable = t[i];

                  if(typeof _testable.inc === 'string' && _testable.inc.length > 0) {

                      loadScript(_testable.inc, {

                          fn: this.utils.assert,
                          scope: this,
                          arg: {
                              namespace: _testable.namespace,
                              testValue: _testable.fn.call(this),
                              assertValue: typeof(_testable.assert) === 'function' ? _testable.assert() : _testable.assert
                          }
                      });

                  } else {

                      this.utils.assert({
                          namespace: _testable.namespace,
                          testValue: _testable.fn.call(this),
                          assertValue: typeof(_testable.assert) === 'function' ? _testable.assert() : _testable.assert
                      });
                  }
              }
          }

          return this;

      // namespace is passed, and we found a matching function, so call it
      } else if(this.funcs.hasOwnProperty(namespace)) {

        this.funcs[namespace](this.args[namespace] || undefined);
        return this;

      // no namespace matching a function - tell user we have no idea what they're
      // trying to do.
      } else {

        this.dbug('warn', 'BLOX does not have requested namespace [%s].', namespace);
        return false;
      }
    },

    // get or set an internal variable.
    // setter can be either with name/value strings
    // or object literal with properties 'name' and 'value'
    v: function(newVar, value) {

        if(typeof newVar === 'string' && typeof value !== 'undefined') {

          if(!this.vars.hasOwnProperty(newVar)) {
              this.vars[newVar] = value;
          }

          return this;

        } else if(typeof newVar === 'string' && typeof value === 'undefined') {

          return this.vars[newVar];

        } else if(typeof newVar === 'object') {

          if(!this.vars.hasOwnProperty(newVar.name)) {
              this.vars[newVar.name] = newVar.value;
          }

          return this;
        }
    },

    // where user created functions occur
    // i.e. - update 'funcs' object, and optionally
    // 'args' and/or 'testables'
    add: function(obj) {

      var testables = this.testables;
      if(!this.funcs.hasOwnProperty(obj.namespace) && obj.arg !== undefined) {

        this.funcs[obj.namespace] = obj.fn;
        this.args[obj.namespace] = obj.arg;
        this.includes[obj.namespace] = obj.inc;

        return this;

      // no arguments, and namespace does not already exist
      // so only update the funcs object
      } else if(!this.funcs.hasOwnProperty(obj.namespace)) {
        this.funcs[obj.namespace] = obj.fn;
        this.includes[obj.namespace] = obj.inc;

        // TODO - ensure namespace can't be written over
        testables.push({
          inc: obj.inc,
          namespace: obj.namespace,
          fn: obj.fn,
          assert: obj.assert
        });

        return this;

      // we already have that namespace - so warn the user and exit
      } else {

          this.dbug("error", "BLOX already contains namespace [%s].", obj.namespace);
          return false;
      }

      return this;
    },

    // remove specified function from 'funcs'
    remove: function(namespace) {

      delete this.funcs[namespace];
      delete this.args[namespace];

      return this;
    },

    // note that the "pub/sub" feature is
    // independent from 'funcs', or 'testables'
    subscribe: function(ev, fn) {

      if(!this.subscribers[ev]) {

        this.subscribers[ev] = [];
      }

      this.subscribers[ev].push(fn);

      return this;
    },

    // remove specified function from event subscription
    unsubscribe: function(ev, fn) {

      for(var i = 0; i < this.subscribers[ev].length; i++) {

        if(this.subscribers[ev][i] === fn) {

          this.subscribers[ev].splice(i, 1);
        }
      }

      return this;
    },

    // publish event to subscribers with (optional) data
    publish: function(ev, data) {
        // add assert calls here as well?
        for(var item in this.subscribers[ev]) {

          this.subscribers[ev][item](data || undefined);
        }

        return this;
    },

    // wrapper for firebug/webkit console - without breaking
    // non supported browsers (guess which those are...)
    dbug: function(lvl, msg, ob) {

      // if not ie < 9.
      if(!window.console || !this.config.devMode) {

        return this;
      }

      switch(lvl) {

        case 'info':

            window.console.info(msg, ob || undefined);
            break;

        case 'log':

            window.console.log(msg, ob || undefined);
            break;

        case 'warn':

            window.console.warn(msg, ob || undefined);
            break;

        case 'error':

            window.console.error(msg, ob || undefined);
            window.console.log("+++ Start Stack Trace +++");
            window.console.trace();
            window.console.log("+++ End Stack Trace +++");
            break;

        default:

            window.console.error('DOH! BLOX.dbug passed unavailable level [%s]. Try "info", "log", "warn" or "error"', lvl);
            break;
      }

      return this;

    }

  };

  window.BLOX = Blox;
}());