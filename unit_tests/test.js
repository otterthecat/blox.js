
test("Blox get/set vars object", function(){


	var blox = BLOX();

	blox.v("first", "sassy");

	equal(blox.vars['first'], "sassy", "Setting [vars] with name/value");
	equal(blox.v("first"), "sassy", "Getting [first var] should be 'sassy'");

	blox.v({name: 'San Deigo', value: 'classy'});

	equal(blox.vars['San Deigo'], "classy", "Setting [vars] with literal object");
	equal(blox.v("San Deigo"), "classy", "Getting [San Deigo] should be 'classy'");

});


test("Blox test setting of config", function(){

	var bloxIsDevMode = BLOX();
	equal(bloxIsDevMode.config.devMode, true, "Blox default config has dev mode set to boolean of [true]");

	var bloxNotDevMode = BLOX({devMode: false});
	equal(bloxNotDevMode.config.devMode, false, "Blox should have dev mode set to boolean of [false]");

});


test("Blox add method (devMode false)", function(){

	var blox = BLOX({devMode: false});

	blox.add({
		namespace: 'test add',
		fn: function(){

			$('#qunit-fixture').text('stuff');
			return $('#qunit-fixture').text();
		}
	});


	equal(typeof blox.funcs['test add'], 'function', 'add() method sucessfully added new fuction');

	blox.exec();

	equal($('#qunit-fixture').text(), 'stuff', 'added function sucessfully updated #qunit-fixture');

});