var Struct = require('../index.js');

/******************************************************************/
// Create structs and automatically allocate an internal buffer
/******************************************************************/
 
// Create 3 structures
var Car = Struct()
	  .charsnt('constructor', 20)
	  .charsnt('model', 32)
	  .word16Ule('year', 20)
	  
var Person = Struct()
		 .chars('firstName', 10)
		 .chars('lastName', 10)
		 .array('items', 3, 'chars', 10)
		 .word16Sle('balance')
		 .struct('car', Car);
		 
Persons = Struct()
		  .word8('presentCount')
		  .array('list', 2, Person);
    
// Allocate an internal buffer required to hold all struct fields
Persons.allocate();
 
// Get total size (in bytes) of all fields
console.log(Persons.length());

// Display Persons internal buffer values
var buf = Persons.buffer();
buf.fill(0);
console.log(buf);

// Write directly through the struct field setter
var proxy = Persons.fields;
proxy.presentCount = 2;
proxy.list[0].firstName = 'John';
proxy.list[0].lastName = 'Johnson';
proxy.list[0].items[0] = 'item1';
proxy.list[0].items[1] = 'item2';
proxy.list[0].balance = -100; 
proxy.list[0].car.constructor = "honda"; 
proxy.list[0].car.model = "civic"; 

proxy.list[1].firstName = 'Bob';
proxy.list[1].lastName = 'Bobson';
proxy.list[1].items[0] = 'item3';
proxy.list[1].items[1] = 'item4';
proxy.list[1].balance = +100;
proxy.list[1].car.constructor = "Very long long constructor name that will be truncated."; 
proxy.list[1].car.model = "We don't care."; 

// Display struct buffer internal content
console.log(buf); 

// Get length of a specific field
console.log(proxy.list[1].items[1].length);

/******************************************************************/
// Create a struct and assign it an existing buffer
/******************************************************************/

// Create struct
var Contact = Struct()
	  .charsnt('name', 64)
	  .charsnt('email', 64);
	  
// Create a buffer manually using the size in bytes of all fields of this struct
var contactBuffer = new Buffer(Contact.length());
contactBuffer.fill(0);

// Assign buffer to the struct
// If the buffer does not have enough space an exception will be thrown
Contact.setBuffer(contactBuffer);

// Write directly through the buffer
contactBuffer.write("Martin", 0)

// Test if it work by displaying the Contact.name field
console.log(Contact.name);
	  

