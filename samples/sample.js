var Struct = require('../index.js');
 
var Person = Struct()
             .chars('firstName',10)
             .chars('lastName',10)
             .array('items',3,'chars',10)
             .word16Sle('balance'),
    Persons = Struct()
              .word8('presentCount')
              .array('list',2,Person);
    
Persons.allocate();
 
console.log(Persons.length());

var buf = Persons.buffer();
for (var i = 0; i < buf.length ; i++) {
  buf[i] = 0;
}
console.log(buf);
                         
var proxy = Persons.fields;

proxy.presentCount = 2;

console.log(buf);

proxy.list[0].firstName = 'John';
proxy.list[0].lastName = 'Johnson';
proxy.list[0].items[0] = 'item1';
proxy.list[0].items[1] = 'item2';
proxy.list[0].balance = -100; 

proxy.list[1].firstName = 'Bob';
proxy.list[1].lastName = 'Bobson';
proxy.list[1].items[0] = 'item3';
proxy.list[1].items[1] = 'item4';
proxy.list[1].balance = +100;

console.log(buf); 
console.log(proxy.list[1].items[1].length );
