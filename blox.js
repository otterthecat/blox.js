window.BLOX = (function(options) {

	// "private" method to load external scripts
	// for any given block.
	var loadScript = function(script_path, callback){

		var newScript = document.createElement('script');
		newScript.type = 'text/javascript';
		newScript.src = script_path;

		newScript.onload = function(){
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

			var blox = this;

			if(typeof settings === 'object') {

				blox.utils.merge(blox.config, settings);
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

			var blox = this;

			// no namespace passed, so loop through them all
			if(!namespace) {


				if(!blox.config.devMode) {
					
					for( var item in blox.funcs) {

						if(blox.includes.hasOwnProperty(item) && typeof blox.includes[item] === 'string'){
							
							// TODO fix scoping to be a bit more sane
							var itm = item;
							loadScript(blox.includes[item], function(){

								(blox.args.hasOwnProperty(itm)) ? blox.funcs[itm].call(b, blox.args[itm]) : blox.funcs[itm].call(b);
							});

						} else {
						
							(blox.args.hasOwnProperty(item)) ? blox.funcs[item].call(b, blox.args[item]) : blox.funcs[item].call(b);
						}
					}
				}

				// TODO tidy this block up a bit
				if(blox.config.devMode) {

					var t = blox.testables;

					for(var i = 0; i < t.length; i++) {

						if(typeof t[i].inc === 'string' && t[i].inc.length > 0){

							// TODO handle scoping better so this 
							// line isn't needed
							var _t = t[i];

							loadScript(t[i].inc, function(){

								blox.utils.assert({
									namespace: _t.namespace,
									testValue: _t.fn.call(b),
									assertValue: typeof(_t.assert) === 'function' ? _t.assert() : _t.assert
								});
							});

						} else {

						blox.utils.assert({
							namespace: t[i].namespace,
							testValue: t[i].fn.call(b),
							assertValue: typeof(t[i].assert) === 'function' ? t[i].assert() : t[i].assert
						});
						}
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
		v :function(newVar, value) {

			var blox = this;

			if(typeof newVar === 'string' && typeof value !== 'undefined') {

				if(!blox.vars.hasOwnProperty(newVar)) {
					blox.vars[newVar] = value;
				}

				return blox;

			} else if(typeof newVar === 'string' && typeof value === 'undefined') {

				return blox.vars[newVar];

			} else if(typeof newVar === 'object') {

				if(!blox.vars.hasOwnProperty(newVar.name)) {
					blox.vars[newVar.name] = newVar.value;
				}

				return blox;
			}
		},

		// where user created functions occur
		// i.e. - update 'funcs' object, and optionally
		// 'args' and/or 'testables'
		add: function(obj) {

			var blox = this;

			var testables = blox.testables;
			if(!blox.funcs.hasOwnProperty(obj.namespace) && obj.arg !== undefined) {

				blox.funcs[obj.namespace] = obj.fn;
				blox.args[obj.namespace] = obj.arg;
				blox.includes[obj.namespace] = obj.inc;



				return blox;

			// no arguments, and namespace does not already exist
			// so only update the funcs object
			} else if(!blox.funcs.hasOwnProperty(obj.namespace)) {
				blox.funcs[obj.namespace] = obj.fn;
				blox.includes[obj.namespace] = obj.inc;

				// TODO - ensure namespace can't be written over
				testables.push({
					inc: obj.inc,
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

			var blox = this;

			// if not ie < 9.
			if(!blox.win.console || !blox.config.devMode) {
				return blox;
			}

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

					blox.win.console.error('DOH! blox.dbug passed unavailable level [%s]. Try "info", "log", "warn" or "error"', lvl);
					break;
			}

			return blox;

		}

	};

	b.init(options);

	return b;
});
