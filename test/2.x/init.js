var expect = require('chai').expect;
var Yunba = require('../../yunba-js-sdk.js');
var config = require('./_config.js');
var options = config.options;
var customId = 'uid_init_' + Math.random().toString().substr(-5);

var client;
describe('#init', function() {
    before(function() {
        client = new Yunba(options);
    });
    it('should work', function(done) {
        var _initSuccess;
        var _connectSuccess;
        var _connectSessionId;
        var _reconnectCallbackCalled = 0;

        var check = function() {
            expect(_initSuccess).to.be.true;
            expect(_connectSuccess).to.be.true;
            expect(_connectSessionId).to.not.be.null;
            expect(_reconnectCallbackCalled).to.be.eq(1);
            done();
        };

        // 建立 socketio 连接
        var called;
        client.init(function (success) {
            // 成功连接回调
            if (called) {
                return;
            }
            called = true;
            _initSuccess = success;
            if (success) {
                client.connect_by_customid(customId, function(success, msg, sessionId) {
                    _connectSuccess = success;
                    _connectSessionId = sessionId;
                    // trigger reconnect event
                    // so the reconnect calback would be called
                    client.socket.socket.reconnect();
                    client.socket.on('reconnect', function() {
                        check();
                    });
                });
            }
        }, function () {
            // 当socketio 断开重连的时候执行的回调
            _reconnectCallbackCalled++;
        });
    });

    after(function(done) {
        client.socket.on('disconnect', function() {
            done();
        });
        client.disconnect();
        client.socket.socket.disconnect();
    });
});

