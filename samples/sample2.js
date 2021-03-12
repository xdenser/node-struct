var Struct = require('../index.js');

/******************************************************************/
// Create structs and automatically allocate an internal buffer
/******************************************************************/
 
// Create 3 structures
var car = new Struct()
	  .chars('c1', 8)
	  .byteArray('b1', 16)
	  .chars('c2', 4)

 car.allocate()

// Get total size (in bytes) of all fields
console.log(car.length());


car.fields.c1 = 'aaaaaaaa'
car.fields.c2 = 'bbbb'
car.fields.b1 = Buffer.from('1234567890123456')

console.log(car.buffer())

var car2 = new Struct()
	  .chars('c1', 8)
	  .byteArray('b1', 16)
	  .chars('c2', 4)

car2.allocate()
car2.setBuffer(Buffer.from(car.buffer()))
for(const key in car.fields) {
	console.log(key, car.fields[key])
}

console.log(car2.fields.b1.toString())