test("Blox get/set vars object", function(){


	blox = buildBlox(BLOX);

	blox.var("first", "sassy");

	equal(blox.vars['first'], "sassy", "Setting [vars] with name/value");
	equal(blox.var("first"), "sassy", "Getting [first var] should be 'sassy'");

	blox.var({name: 'San Deigo', value: 'classy'});

	equal(blox.vars['San Deigo'], "classy", "Setting [vars] with literal object");
	equal(blox.var("San Deigo"), "classy", "Getting [San Deigo] should be 'classy'");

});