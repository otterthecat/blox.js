var BLOX = {

	// global window object
	win: window,

	// global document
	doc: document,

	// object to hold user functions
	funcs: {},

	// object to hold arguments for same-namespaced "funcs" (optional)
	args: {},

	// object to hold variables to be shared across funcs
	vars: {},

	// default settings (user configurable)
	config: {
		devMode: true,
		preventVarOverride: true
	},

	// object to hold susbscribing events
	subscribers: {},

	// array of of unit testing functions (ignored if config.devMode set to true)
	testables: [],

	// collection of helper methods
	utils: {

		merge: function(baseObj, addObj) {

			for(item in addObj) {

				// 'merge' cannot be overridden in this manner,
				// as it is used elsewhere in 'blox_prototype'
				if(item !== 'merge') {
					baseObj[item] = addObj[item];
				} else {

					BLOX.dbug('warn', '[merge] is not replaceable in blox_prototype, ignoring %o', item);
				}
			}

			return baseObj;

		},

		// used for simple unit testing of 'funcs' functions
		assert: function(obj) {

			// sample expected format:
			// {namespace : '', testValue : '', assertValue : ''}
			if(!BLOX.config.devMode) {
				return null;
			}

			BLOX.dbug('warn', 'Assert [' + obj.namespace + ']: ' + obj.testValue + " === " + obj.assertValue);

			if(obj.testValue === obj.assertValue) {

				BLOX.dbug('info', "PASS : " + obj.testValue + " === " + obj.assertValue);
				return true;
			} else {

				BLOX.dbug('error', "FAIL : " + obj.testValue + " !== " + obj.assertValue);
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

			this.utils.merge(this.config, settings);
		}

		return this;
	},

	// fire 'blox' to happen on dom load
	// (or page load for lesser browsers)
	launch: function() {

		var blox = this;

		// browser is not inept
		if(blox.doc.addEventListener) {

			blox.doc.addEventListener("DOMContentLoaded", function() {

				return blox.exec();

			}, false);

		} else {
			// browser is inept explorer 8 or less
			blox.win.onload = function() {

				return blox.exec();
			};
		}
	},

	// runs through 'funcs' object and call all functions within.
	// will run in tandem with utils.assert() if config.devMode set to true
	exec: function(namespace) {

		blox = this;

		// no namespace passed, so loop through them all
		if(!namespace) {


			if(!blox.config.devMode) {
				for(var item in blox.funcs) {
					(blox.args.hasOwnProperty(item)) ? blox.funcs[item](blox.args[item]) : blox.funcs[item]();

				}
			}

			// TODO tidy this block up a bit
			if(blox.config.devMode) {

				var t = blox.testables;

				for(var i = 0; i < t.length; i++) {

					blox.utils.assert({
						namespace: t[i].namespace,
						testValue: t[i].fn(),
						assertValue: typeof(t[i].assert) === 'function' ? t[i].assert() : t[i].assert
					});

				}
			}

			return blox;

			// namespace is passed, and we found a matching function, so call it
		} else if(blox.funcs.hasOwnProperty(namespace)) {

			(blox.args.hasOwnProperty(namespace)) ? blox.funcs[namespace](blox.args[namespace]) : blox.funcs[namespace]();

			return blox;

			// no namespace matching a function - tell user we have no idea what they're
			// trying to do.
		} else {

			blox.dbug('warn', 'blox does not have requested namespace [%s].', namespace);
			return false;
		}
	},

	// get or set an internal variable.
	// setter can be either with name/value strings
	// or object literal with properties 'name' and 'value'
	var :function(newVar, value) {

			blox = this;

			if(typeof newVar === 'string' && typeof value !== 'undefined') {

				if(!blox.vars.hasOwnProperty(newVar)) {
					blox.vars[newVar] = value;
				}

				return blox.vars;

			} else if(typeof newVar === 'string' && typeof value === 'undefined') {

				return blox.vars[newVar];

			} else if(typeof newVar === 'object') {

				if(!blox.vars.hasOwnProperty(newVar.name)) {
					blox.vars[newVar.name] = newVar.value;
				}

				return blox.vars;
			}
		},

		// where user created functions occur
		// i.e. - update 'funcs' object, and optionally
		// 'args' and/or 'testables'
		add: function(obj) {

			blox = this;

			var testables = blox.testables;
			if(!blox.funcs.hasOwnProperty(obj.namespace) && obj.arg !== undefined) {
				blox.funcs[obj.namespace] = obj.fn;
				blox.args[obj.namespace] = obj.arg;

				return blox;

			// no arguments, and namespace does not already exist
			// so only update the funcs object
			} else if(!blox.funcs.hasOwnProperty(obj.namespace)) {
				blox.funcs[obj.namespace] = obj.fn;

				// TODO - ensure namespace can't be written over
				testables.push({
					namespace: obj.namespace,
					fn: obj.fn,
					assert: obj.assert
				});

				return blox;

			// we already have that namespace - so warn the user and exit
			} else {

				blox.dbug("error", "blox already contains namespace [%s].", obj.namespace);
				return false;
			}

			return blox;
		},

		// remove specified function from 'funcs'
		remove: function(namespace) {

			delete this.funcs[namespace]
			delete this.args[namespace];

		},

		// note that the "pub/sub" feature is
		// independent from 'funcs', or 'testables'
		subscribe: function(ev, fn) {

			if(!this.subscribers[ev]) {
				this.subscribers[ev] = [];
			}

			this.subscribers[ev].push(fn);

			return this.subscribers[ev];

		},

		// remove specified function from event subscription
		unsubscribe: function(ev, fn) {

			for(var i = 0; i < this.subscribers[ev].length; i++) {

				if(this.subscribers[ev][i] === fn) {

					this.subscribers[ev].splice(i, 1);
				}
			}

			return this.subscribers[ev];

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

			blox = this;

			// if not ie < 9.
			if(!blox.win.console || !blox.config.devMode) {
				return blox;
			};

			switch(lvl) {

			case 'info':

				ob ? blox.win.console.info(msg, ob) : blox.win.console.info(msg);
				break;

			case 'log':

				ob ? blox.win.console.log(msg, ob) : blox.win.console.log(msg);
				break;

			case 'warn':

				ob ? blox.win.console.warn(msg, ob) : blox.win.console.warn(msg);
				break;

			case 'error':

				ob ? blox.win.console.error(msg, ob) : blox.win.console.error(msg);
				console.log("+++ Start Stack Trace +++");
				console.trace();
				console.log("+++ End Stack Trace +++");
				break;

			default:

				return blox.win.console.error('DOH! blox.dbug passed unavailable level [%s]. Try "info", "log", "warn" or "error"', lvl);
			};

			return blox;

		}

}

// used for spawning new blox_prototype objects

function buildBlox(proto, args) {

	function F() {};
	F.prototype = proto;

	var f = new F();

	if(typeof args !== 'object') {

		f.init();
	} else {

		f.init(args);
	}

	return f;
}