/**
 * Default export `Struct`.
 */
// export default Struct;
module.exports = exports = Struct;

// compatibility
exports.Struct = Struct;

function byteField(p, offset) {
    this.length = 1;
    this.offset = offset;
    this.get = function () {
        return p.buf[offset];
    }
    this.set = function (val) {
        p.buf[offset] = val;
    }
}

function boolField(p, offset, length) {
    this.length = length;
    this.offset = offset;
    this.get = function() {
        return (p.buf[offset] > 0);
    }
    this.set = function (val) {
        p.buf[offset] = val ? 1 : 0;
    }
}

function intField(p, offset, length, le, signed) {
    this.length = length;
    this.offset = offset;
    
    function bec(cb) {
        for (var i = 0; i < length; i++)
            cb(i, length - i - 1);
    }
    
    function lec(cb) {
        for (var i = 0; i < length; i++)
            cb(i, i);
    }
    
    function getUVal(bor) {
        var val = 0;
        bor(function (i, o) {
            val += Math.pow(256, o) * p.buf[offset + i];
        })
        return val;
    }
    
    function getSVal(bor) {
        
        var val = getUVal(bor);
        if ((p.buf[offset + (le ? (length - 1) : 0)] & 0x80) == 0x80) {
            val -= Math.pow(256, length);
        }
        return val;
    }
    
    function setVal(bor, val) {
        bor(function (i, o) {
            p.buf[offset + i] = Math.floor(val / Math.pow(256, o)) & 0xff;
        });
    }
    
    var 
     nativeSuff = (signed?'':'U') + 'Int' + (length * 8) + (le?'LE':'BE'),
        readMethod = Buffer.prototype['read' + nativeSuff], writeMethod = Buffer.prototype['write' + nativeSuff];
    
    
    if (!readMethod) {
        this.get = function () {
            var bor = le ? lec : bec;
            return (signed ? getSVal(bor) : getUVal(bor));
        }
    }
    else {
        this.get = function () {
            return readMethod.call(p.buf, offset);
        };
    }
    
    
    if (!writeMethod) {
        this.set = function (val) {
            var bor = le ? lec : bec;
            setVal(bor, val);
        }
    }
    else {
        this.set = function (val) {
            writeMethod.call(p.buf, val, offset);
        }
    }

}

function floatField(p, offset, le) {
    this.length = 4;
    this.offset = offset;
    this.get = function () {
        return le ? p.buf.readFloatLE(offset) : p.buf.readFloatBE(offset);
    }
    this.set = function (val) {
        return le ? p.buf.writeFloatLE(val, offset) : p.buf.writeFloatBE(val, offset);
    }
}

function doubleField(p, offset, le) {
    this.length = 8;
    this.offset = offset;
    this.get = function () {
        return le ? p.buf.readDoubleLE(offset) : p.buf.readDoubleBE(offset);
    }
    this.set = function (val) {
        return le ? p.buf.writeDoubleLE(val, offset) : p.buf.writeDoubleBE(val, offset);
    }
}

function charField(p, offset, length, encoding, secure) {
    var self = this;
    self.length = length;
    self.offset = offset;
    self.encoding = encoding;
    self.secure = secure;
    self.get = function () {
        if (!length)
            return;

        var result = p.buf.toString(self.encoding, offset, (offset + length));
        var strlen = result.indexOf("\0");
        if (strlen == -1) {
            return result;
        } else {
            return result.slice(0, strlen);
        }
    }
    self.set = function (val) {
        if (!length)
            return;
        
        // Be string is terminated with the null char, else troncate it
        if (secure === true) {
            
            // Append \0 to the string
            val += "\0";
            if (val.length >= length) {
                val = val.substring(0, length - 1);
                val += "\0";
            }
            
            // Write to buffer
            p.buf.write(val, offset, val.length, self.encoding);
            
            // Fill rest of the buffer with \0
            var remainSpace = (length - val.length);
            if (remainSpace > 0) {
                p.buf.fill(0, (offset + val.length), offset + length);
            }

        } else {
            // Trust Buffer class to write the string into the buffer
            p.buf.write(val, offset, length, self.encoding);
        }
    }
}

function structField(p, offset, struct) {
    this.length = struct.length();
    this.offset = offset;
    this.get = function () {
        return struct;
    }
    this.set = function (val) {
        struct.set(val);
    }
    this.allocate = function () {
        struct._setBuff(p.buf.slice(offset, offset + struct.length()));
    }
}

function arrayField(p, offset, len, type) {
    var as = Struct();
    var args = [].slice.call(arguments, 4);
    args.unshift(0);
    for (var i = 0; i < len; i++) {
        if (type instanceof Struct) {
            as.struct(i, type.clone());
        } else if (type in as) {
            args[0] = i;
            as[type].apply(as, args);
        }
    }
    this.length = as.length();
    this.offset = offset;
    this.allocate = function () {
        as._setBuff(p.buf.slice(offset, offset + as.length()));
    }
    this.get = function () {
        return as;
    }
    this.set = function (val) {
        as.set(val);
    }
}

function Struct() {
    if (!(this instanceof Struct))
        return new Struct;
    
    var priv = {
        buf : {},
        allocated : false,
        len : 0,
        fields : {},
        closures : []
    }, self = this;
    
    function checkAllocated() {
        if (priv.allocated)
            throw new Error('Cant change struct after allocation');
    }
        
    // Create handlers for various float Field Variants
    [true, false].forEach(function (le) {
        self['float' + (le ? 'le' : 'be')] = function (key) {
            checkAllocated();
            priv.closures.push(function (p) {
                var n = 4;
                p.fields[key] = new floatField(p, p.len, le);
                p.len += n;
            });
            return this;
        }
    });
    
    // Create handlers for various double Field Variants
    [true, false].forEach(function (le) {
        self['double' + (le ? 'le' : 'be')] = function (key) {
            checkAllocated();
            priv.closures.push(function (p) {
                var n = 8;
                p.fields[key] = new doubleField(p, p.len, le);
                p.len += n;
            });
            return this;
        }
    });
    
    // Create handlers for various Bool Field Variants
    [1, 2, 3, 4].forEach(function (n) {
        self['bool' + (n == 1 ? '' : n)] = function (key) {
            checkAllocated();
            priv.closures.push(function (p) {
                p.fields[key] = new boolField(p, p.len, n);
                p.len += n;
            });
            return this;
        }
    });
    
    // Create handlers for various Integer Field Variants
    [1, 2, 3, 4, 6, 8].forEach(function (n) {
        [true, false].forEach(function (le) {
            [true, false].forEach(function (signed) {
                var name = 'word' + (n * 8) + (signed ? 'S' : 'U') + (le ? 'le' : 'be');
                self[name] = function (key) {
                    checkAllocated();
                    priv.closures.push(function (p) {
                        p.fields[key] = new intField(p, p.len, n, le, signed);
                        p.len += n;
                    });
                    return this;
                };
            });
        });
    });
    this.word8 = this.word8Ule;
    
    ['chars', 'charsnt'].forEach(function (c) {
        self[c] = function (key, length, encoding) {
            checkAllocated();
            priv.closures.push(function (p) {
                p.fields[key] = new charField(p, p.len, length, encoding || 'ascii', (c == 'charsnt'));
                p.len += length;
            });
            return this;
        }
    });

    this.struct = function (key, struct) {
        checkAllocated();
        priv.closures.push(function (p) {
            p.fields[key] = new structField(p, p.len, struct.clone());
            p.len += p.fields[key].length;
        });
        return this;
    }
    function construct(constructor, args) {
        function F() {
            return constructor.apply(this, args);
        }
        
        F.prototype = constructor.prototype;
        return new F();
    }
    
    
    this.array = function (key, length, type) {
        checkAllocated();
        var args = [].slice.call(arguments, 1);
        args.unshift(null);
        args.unshift(null);
        priv.closures.push(function (p) {
            args[0] = p;
            args[1] = p.len;
            p.fields[key] = construct(arrayField, args);
            p.len += p.fields[key].length;
        });
        
        return this;
    }
    var beenHere = false;
    
    function applyClosures(p) {
        if (beenHere)
            return;
        p.closures.forEach(function (el) {
            el(p);
        });
        beenHere = true;
    }
    
    function allocateFields() {
        for (var key in priv.fields) {
            if ('allocate' in priv.fields[key])
                priv.fields[key].allocate();
        }
    }
    
    this._setBuff = this.setBuffer = function (buff, buffLength) {
        applyClosures(priv);
        if (typeof (buffLength) === 'number') {
            if (buffLength > buff.length) {
                throw new Error('Invalid specified buffer size !');
            }
            priv.buf = buff.slice(0, buffLength);
        } else {
            priv.buf = buff;
        }
        if (priv.buf.length < priv.len) {
            throw new Error('Buffer size too small for struct layout !');
        }
        allocateFields();
        priv.allocated = true;
    }
    
    this.allocate = function () {
        applyClosures(priv);
        if (Buffer.alloc) {
            priv.buf = Buffer.alloc(priv.len);
        } else {
            priv.buf = new Buffer(priv.len);
            priv.buf.fill(0);
        }
        allocateFields();
        priv.allocated = true;
        return this;
    }
    
    this._getPriv = function () {
        return priv;
    }
    
    this.getOffset = function (field) {
        if (priv.fields[field]) return priv.fields[field].offset;
    }
    
    this.clone = function () {
        var c = new Struct;
        var p = c._getPriv();
        p.closures = priv.closures.slice(0);
        return c;
    }
    
    this.length = function () {
        applyClosures(priv);
        return priv.len;
    }
    
    this.get = function (key) {
        if (key in priv.fields) {
            return priv.fields[key].get();
        } else
            throw new Error('Can not find field ' + key);
    }
    
    this.set = function (key, val) {
        if (arguments.length == 2) {
            if (key in priv.fields) {
                priv.fields[key].set(val);
            } else
                throw new Error('Can not find field ' + key);
        } else if (Buffer.isBuffer(key)) {
            this._setBuff(key);
        } else {
            for (var k in key) {
                this.set(k, key[k]);
            }
        }
    }
    this.buffer = function () {
        return priv.buf;
    }
    
    
    function getFields() {
        var fields = {};
        Object.keys(priv.fields).forEach(function (key) {
            var setFunc, getFunc;
            if (priv.fields[key] instanceof structField ||
               priv.fields[key] instanceof arrayField) {
                getFunc = function () {
                    return priv.fields[key].get().fields;
                };
                setFunc = function (newVal) {
                    self.set(key, newVal);
                };
            }
            else {
                getFunc = priv.fields[key].get;
                setFunc = priv.fields[key].set;
            };
            
            Object.defineProperty(fields, key, {
                get : getFunc,
                set : setFunc,
                enumerable : true
            });
        });
        return fields;
    };
    
    var _fields;
    Object.defineProperty(this, 'fields', {
        get : function () {
            if (_fields)
                return _fields;
            return (_fields = getFields());
        },
        enumerable : true,
        configurable : true
    });

}
