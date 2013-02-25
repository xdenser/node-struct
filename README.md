Struct
======
NodeJS module to work with buffers as structures (or records) of various fields (like c struct declaration, or pascal record).
Uses [node-proxy](https://github.com/samshull/node-proxy).

Installation
============

To install with [npm](http://github.com/isaacs/npm):
 
    npm install struct
    

Example
=======

Define some structure: 

	var Struct = require('../index.js').Struct;
 
	var Person = Struct()
		.chars('firstName',10)
		.chars('lastName',10)
		.array('items',3,'chars',10)
		.word16Sle('balance'),
	People = Struct()
		.word8('presentCount')
		.array('list',2,Person);
		
Now allocate buffer for it
	
	People.allocate();
	var buf = People.buffer();
	
Clear buffer to see how it will change later:
	
	var buf = Persons.buffer();
	for (var i = 0; i < buf.length ; i++) {
  		buf[i] = 0;
	}
	console.log(buf);
	
Output:
	<Buffer 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00>
	
	
Now you can access memory as defined binary structure with `fields` property in a handy manner.		

	var proxy = People.fields;
	proxy.presentCount = 2;
	console.log(buf);
	
Output: 
	
	<Buffer 02 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00>
	
And so on

	proxy.list[0].firstName = 'John';
	console.log(buf);
	
Output:
	<Buffer 02 4a 6f 68 6e 00 00 00 00 00 00 ...	
	     
Reference
=========

##Struct()

creates struct object, you may define your data structure with chain calls to following methods:

###word8(name)
defines one byte unsigned field, name - always defines name of field

### word8Sle(name),word8Sbe(name)
define one byte signed field

### word16Sle(name),word16Sbe(name)
define 16 bit signed field with little-endian and big-endian byte order

### word16Ule(name),word16Ube(name)
define 16 bit unsigned field with little-endian and big-endian byte order

### word32Sle(name),word32Sbe(name),word32Ule(name),word32Ube(name),word64Sle(name),word64Sbe(name),word64Ule(name),word64Ube(name)
same for 32 and 64 bit fields

### chars(name,length[,encoding])
defines array of chars with `encoding` ('ascii' by default) encoding, name - name of the field, length - length of array

### array(name, length, type, ...)
defines array of fields (internally it is Struct() object with field names set to 0,1,2,... ).
 
- `name` - name of array field;
- `length` - length of array;
- `type` - `string||Struct()`, string is interpreted as name of Struct()  method to call for each array element.

For example `array('numbers',5,'word16Ule')` will define array of 2 byte unsigned words (x86 byte order) with 5 elements.
Any parameters that follow type will be passed to definition function. 
So `array('someName',3,'chars',20)` defines 3 element array of 20 chars.
You also may pass Struct() object to make array of structures.

### struct(name, Struct() )   
      
defines field that itself is a structure.

## Other methods

### get(fieldName)
allows access to field (reads value from it's offset in buffer)

### set(fieldName, value)
allows access to field (write value at it's offset in buffer)

### allocate()
allocates buffer for defined structure with proper size. This is used when you need to format data in buffer and send or write it out.
 
### _setBuff(buffer)
sets buffer reference of object to other buffer. This may be used to parse or adjust some binary data received or read from somewhere.

### buffer()
returns currently used buffer. Before you may read or write to structure you have to call either allocate() or _setBuff(buffer). 
This is not true only for Struct() objects that are fields themselves, as they are allocated automatically by parent Struct object.

## fields property
Struct().fields is a Proxy object allowing to access structure fields in a handy manner - as any other javascript object.
 

  
