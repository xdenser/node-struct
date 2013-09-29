var Struct = require('../index.js').Struct;

var 
 TestStruc = Struct().word32Sle('f');
 
 
TestStruc.allocate();

var 
   buf = TestStruc.buffer(),
   proxy = TestStruc.fields;


function testProxyWRW(z){
    proxy.f = z;
    proxy.f = proxy.f + 1;
}

function testDirectWRW(z){
    TestStruc.set('f',z);
    TestStruc.set('f', TestStruc.get('f') + 1);
}  

function testNativeWRW(z){
    buf.writeInt32LE(z,0);
    buf.writeInt32LE(buf.readInt32LE(0)+1,0);
}

function doTest(f){
    var s = Date.now();//process.hrtime();
    for(var i=0; i< 100000; i++){
        f(i);
    }
    return [Date.now(),s];
}

var t1 = doTest(testProxyWRW), t2 = doTest(testNativeWRW), t3 = doTest(testDirectWRW); 
console.log(t1[0]-t1[1]);
console.log(t2[0]-t2[1]);
console.log(t3[0]-t3[1]);