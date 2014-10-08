'use strict';

var async = require('..');

var foo = async(function*(){
  return 'foo';
});
var bar = async(function*(){
  return 'bar';
});
var baz = async(function*(){
  throw new Error('Sentinel');
})
var rec1 = async(function*(n){
  return n === 0 ? 0 : 1 + (yield rec1(n-1));
});

var recx = function(n) {
  return new Promise(function (fulfill, reject) {
    if (n === 0) {
      fulfill(0);
    } else {
      asap(function(){
        recx(n-1).then(function (res) {
          fulfill(res+1);
        }, reject);
      });
    }
  });
}

describe('async', function(){
  it('should return a function',function(){
    foo.should.be.a.Function;
  });
  it('should be composable', function(){
    var foobar = async(function*(){
      var a = yield foo();
      var b = yield bar();
      return a + b;
    });
    return foobar().should.become('foobar');
  });
  it('should support recursion and be reasonably fast', function(){
    var n = 10000;
    return rec1(n).should.become(n);
  });
  it('should preserve `this` context', function(){
    var obj = {
      value: 'baz',
      getIt: async(function*(){
        return this.value;
      })
    };
    return obj.getIt().should.become('baz');
  });
  describe('when used with `throw`', function(){
    it('should propagate immediate exceptions', function() {
      return baz().should.be.rejectedWith(Error,'Sentinel');
    });
    it('should handle nested exceptions with `try/catch`', function(){
      var foobarbaz = async(function*(){
        try {
          yield foo();
          yield bar();
          yield baz(); // will throw
        } catch (e) {
          return 'handled'
        }
      });
      return foobarbaz().should.become('handled');
    });
    it('should propagate nested exceptions', function(){
      var foobarbaz = async(function*(){
        yield foo();
        yield bar();
        yield baz();
      });
      return foobarbaz().should.be.rejectedWith(Error,'Sentinel');
    });
  });
  describe('result',function(){
    it('should return a promise', function(){
      foo().should.have.a.property('then').that.is.a.Function;
    });
    it('should be resolved into correct result', function(){
      return foo().should.become('foo');
    });
  })
});

