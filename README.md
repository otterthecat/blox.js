blox.js
=======

A way to modularize javascript code

caveats
-------

This is still a work in progress - and while I don't intdend any of the major features/functions to change
anytime soon, it's entirely possible there will be changes. 

Documentation is also not complete, in part because this is still in progress, and in part because I'm
lazy.

To summarize: 'blah blah blah. Use at your own risk'

instantiation
-------------

Create a new blox by calling the BLOX object (case sensitive) and pass an object of user configs:

	blox = BLOX(optionsLiteral)

currently the only available/useable option is *devMode*, which currently defaults to *true*


basic usage
-----------

There are essentially two primary ways to work with a *blox* object: usinng *add* or *subscribe/publish*.

### add

Below is a typical usage scenario. When invoking the *add* method, pass a new object with a namepace defined
(which will identify the function if it needs to be called directly), the actual function to run (within the 'fn')
property, and the (currently optional) *assert* property, which will act as a simple unit test if *devMode* is enabled.
The assertions can be viewed from a browsers console (if supported).

	blox.add({
		namespace: 'do_this',
		fn: function(){

			return document.getElementsByTagName('body')[0].style.color = 'red';
		},
		assert: function(){

			return document.getElementsByTagName('body')[0].style.color;
		}

	});

All functions added in this manner can then be called using 

	blox.launch();

which will wait for DOM ready or page load before running (depending on browser).

### subscribe/publish

Additionally, a *blox* can be used as a basic *pub/sub* by simply passing a defined event and desired
as arguments:

	blox.subscribe("drink", function(){

		alert("burp");
	});

	blox.subscribe("drink", function(data){

		alert("I think I'm drunk on "+data);
	});

The two subscribers above could then be called with a *blox*'s *publish* method,
passing data to the subscribers via the *publish* method's second argument:

	blox.publish("drink", "root beer");
