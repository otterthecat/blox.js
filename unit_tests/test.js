
test("Blox get/set vars object", function(){


	blox = BLOX();

	blox.v("first", "sassy");

	equal(blox.vars['first'], "sassy", "Setting [vars] with name/value");
	equal(blox.v("first"), "sassy", "Getting [first var] should be 'sassy'");

	blox.v({name: 'San Deigo', value: 'classy'});

	equal(blox.vars['San Deigo'], "classy", "Setting [vars] with literal object");
	equal(blox.v("San Deigo"), "classy", "Getting [San Deigo] should be 'classy'");

});


test("Blox test setting of config", function(){

	bloxIsDevMode = BLOX();
	equal(bloxIsDevMode.config.devMode, true, "Blox default config has dev mode set to boolean of [true]");

	bloxNotDevMode = BLOX({devMode: false});
	equal(bloxNotDevMode.config.devMode, false, "Blox should have dev mode set to boolean of [false]");

});