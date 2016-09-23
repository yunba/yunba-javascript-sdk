var expect = require('chai').expect;
var Yunba = require('../../yunba-js-sdk.js');
var config = require('./_config.js');
var options = config.options;

var client;
var customId = 'uid_customid_' + Math.random().toString().substr(-5);
before(function() {
    client = new Yunba(options);
});

describe('#connect_by_customid', function() {
    it('should success', function(done) {
        var called;
        client.init(function (success) {
            if (called) {
                return
            }
            called = true;
            if (success) {
                client.connect_by_customid(customId, function(success) {
                    expect(success).to.be.true;
                    done();
                });
            } else {
                throw 'init failed';
            }
        });
    });
});

after(function(done) {
    client.socket.on('disconnect', function() {
        done();
    });
    client.disconnect();
    client.socket.disconnect();
});