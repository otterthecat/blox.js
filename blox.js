window.BLOX = (function(options) {

	// "private" method to load external scripts
	// for any given block.
	var loadScript = function(script_path, callback) {

			var newScript = document.createElement('script');
			newScript.type = 'text/javascript';
			newScript.src = script_path;

			newScript.onload = function() {
				callback();
			}

			document.getElementsByTagName('body')[0].appendChild(newScript);

		};

	var b = {
		// global window object
		win: window,

		// global document
		doc: document,

		// object to hold paths of imported scripts
		includes: {},

		// object to hold user functions
		funcs: {},

		// object to hold arguments for same-namespaced "funcs" (optional)
		args: {},

		// object to hold variables to be shared across funcs
		vars: {},

		// default settings (user configurable)
		config: {
			devMode: true,
			scripts: [],
			preventVarOverride: true
		},

		// object to hold susbscribing events
		subscribers: {},

		// array of of unit testing functions (ignored if config.devMode set to true)
		testables: [],

		// collection of helper methods
		utils: {

			merge: function(baseObj, addObj) {

				for(var item in addObj) {

					// 'merge' cannot be overridden in this manner,
					// as it is used elsewhere in 'blox_prototype'
					if(item !== 'merge') {
						baseObj[item] = addObj[item];
					} else {

						b.dbug('warn', '[merge] is not replaceable in blox_prototype, ignoring %o', item);
					}
				}

				return baseObj;

			},

			// used for simple unit testing of 'funcs' functions
			assert: function(obj) {

				// sample expected format:
				// {inc: '', namespace : '', testValue : '', assertValue : ''}
				if(!b.config.devMode) {
					return null;
				}

				b.dbug('warn', 'Assert [' + obj.namespace + ']: ' + obj.testValue + " === " + obj.assertValue);

				if(obj.testValue === obj.assertValue) {

					b.dbug('info', "PASS : " + obj.testValue + " === " + obj.assertValue);
					return true;
				} else {

					b.dbug('error', "FAIL : " + obj.testValue + " !== " + obj.assertValue);
					return false;
				}
			}
		},


		setUtils: function(utilObj) {

			utils = this.utils;
			utils.merge(utils, utilObj);

			return this;
		},

		// user configurations can be passed
		init: function(settings) {

			if(typeof settings === 'object') {

				b.utils.merge(b.config, settings);
			}

			return this;
		},

		// fire 'b' to happen on dom load
		// (or page load for lesser browsers)
		launch: function() {

			// browser is not inept
			if(b.doc.addEventListener) {

				b.doc.addEventListener("DOMContentLoaded", function() {

					return b.exec();

				}, false);

			} else {
				// browser is inept explorer 8 or less
				b.win.onload = function() {

					return b.exec();
				};
			}
		},

		// runs through 'funcs' object and call all functions within.
		// will run in tandem with utils.assert() if config.devMode set to true
		exec: function(namespace) {

			// no namespace passed, so loop through them all
			if(!namespace) {

				if(!b.config.devMode) {

					for(var item in b.funcs) {

						if(b.includes.hasOwnProperty(item) && typeof b.includes[item] === 'string') {

							loadScript(b.includes[item], function() {

								(b.args.hasOwnProperty(item)) ? b.funcs[item].call(b, b.args[item]) : b.funcs[item].call(b);
							});

						} else {

							(b.args.hasOwnProperty(item)) ? b.funcs[item].call(b, b.args[item]) : b.funcs[item].call(b);
						}
					}
				}

				// TODO tidy this block up a bit
				if(b.config.devMode) {

					var t = b.testables;

					for(var i = 0; i < t.length; i++) {

						var _testable = t[i];

						if(typeof _testable.inc === 'string' && _testable.inc.length > 0) {

							loadScript(_testable.inc, function() {

								b.utils.assert({
									namespace: _testable.namespace,
									testValue: _testable.fn.call(b),
									assertValue: typeof(_testable.assert) === 'function' ? _testable.assert() : _testable.assert
								});
							});

						} else {

							b.utils.assert({
								namespace: _testable.namespace,
								testValue: _testable.fn.call(b),
								assertValue: typeof(_testable.assert) === 'function' ? _testable.assert() : _testable.assert
							});
						}
					}
				}

				return b;

				// namespace is passed, and we found a matching function, so call it
			} else if(b.funcs.hasOwnProperty(namespace)) {

				(b.args.hasOwnProperty(namespace)) ? b.funcs[namespace](b.args[namespace]) : b.funcs[namespace]();

				return b;

				// no namespace matching a function - tell user we have no idea what they're
				// trying to do.
			} else {

				b.dbug('warn', 'BLOX does not have requested namespace [%s].', namespace);
				return false;
			}
		},

		// get or set an internal variable.
		// setter can be either with name/value strings
		// or object literal with properties 'name' and 'value'
		v: function(newVar, value) {

			if(typeof newVar === 'string' && typeof value !== 'undefined') {

				if(!b.vars.hasOwnProperty(newVar)) {
					b.vars[newVar] = value;
				}

				return b;

			} else if(typeof newVar === 'string' && typeof value === 'undefined') {

				return b.vars[newVar];

			} else if(typeof newVar === 'object') {

				if(!b.vars.hasOwnProperty(newVar.name)) {
					b.vars[newVar.name] = newVar.value;
				}

				return b;
			}
		},

		// where user created functions occur
		// i.e. - update 'funcs' object, and optionally
		// 'args' and/or 'testables'
		add: function(obj) {

			var testables = b.testables;
			if(!b.funcs.hasOwnProperty(obj.namespace) && obj.arg !== undefined) {

				b.funcs[obj.namespace] = obj.fn;
				b.args[obj.namespace] = obj.arg;
				b.includes[obj.namespace] = obj.inc;

				return b;

				// no arguments, and namespace does not already exist
				// so only update the funcs object
			} else if(!b.funcs.hasOwnProperty(obj.namespace)) {
				b.funcs[obj.namespace] = obj.fn;
				b.includes[obj.namespace] = obj.inc;

				// TODO - ensure namespace can't be written over
				testables.push({
					inc: obj.inc,
					namespace: obj.namespace,
					fn: obj.fn,
					assert: obj.assert
				});

				return b;

				// we already have that namespace - so warn the user and exit
			} else {

				b.dbug("error", "BLOX already contains namespace [%s].", obj.namespace);
				return false;
			}

			return b;
		},

		// remove specified function from 'funcs'
		remove: function(namespace) {

			delete this.funcs[namespace]
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

				data ? this.subscribers[ev][item](data) : this.subscribers[ev][item]();
			}

			return this;
		},

		// wrapper for firebug/webkit console - without breaking
		// non supported browsers (guess which those are...)
		dbug: function(lvl, msg, ob) {

			// if not ie < 9.
			if(!b.win.console || !b.config.devMode) {
				return b;
			}

			switch(lvl) {

			case 'info':

				ob ? b.win.console.info(msg, ob) : b.win.console.info(msg);
				break;

			case 'log':

				ob ? b.win.console.log(msg, ob) : b.win.console.log(msg);
				break;

			case 'warn':

				ob ? b.win.console.warn(msg, ob) : b.win.console.warn(msg);
				break;

			case 'error':

				ob ? b.win.console.error(msg, ob) : b.win.console.error(msg);
				console.log("+++ Start Stack Trace +++");
				console.trace();
				console.log("+++ End Stack Trace +++");
				break;

			default:

				b.win.console.error('DOH! BLOX.dbug passed unavailable level [%s]. Try "info", "log", "warn" or "error"', lvl);
				break;
			}

			return b;

		}

	};

	b.init(options);

	return b;
});