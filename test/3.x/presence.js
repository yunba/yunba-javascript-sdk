var expect = require('chai').expect;
var Yunba = require('../../yunba-js-sdk-v3.js');
var options = require('./_config.js').options;
options.customId = 'uid_base_' + Math.random().toString().substr(-5);

var client;
describe('#presence', function() {
    before(function(done) {
        var client1Options = {
            url: options.url,
            appkey: options.appkey,
            customId: options.customId + '_1'
        };
        client1 = new Yunba(client1Options);
        var client2Options = {
            url: options.url,
            appkey: options.appkey,
            customId: options.customId + '_2'
        }
        client2 = new Yunba(client2Options);
        done();
    });


    describe('#subscribe_presence', function() {
        describe('#join msg', function() {
            var topic = 'topic' + Math.random().toString().substr(2);
            var alias = 'alias' + Math.random().toString().substr(2);
            var messageHandler;
            before(function(done) {
                client2.setAlias(alias, function(err) {
                    expect(err).to.be.a('null');
                    done();
                });
            });
            it('should work', function(done) {
                messageHandler = function(data) {
                    if (data.presence) {
                        expect(data.presence.action).to.be.eq('join');
                        expect(data.presence.alias).to.be.eq(alias);
                        done();
                    }
                };
                client1.subscribePresence({
                    topic: topic,
                    messageHandler: messageHandler
                }, function(err) {
                    expect(err).to.be.a('null');
                    client2.subscribe({
                        topic: topic
                    }, function(err) {
                        expect(err).to.be.a('null');
                    });
                });
            });
            after(function(done) {
                client1.unsubscribePresence({
                    topic: topic,
                    messageHandler: messageHandler
                }, function(err) {
                    expect(err).to.be.a('null');
                    done();
                });
            });
        });

        describe('#leave msg', function() {
            var topic = 'topic' + Math.random().toString().substr(2);
            var alias = 'alias' + Math.random().toString().substr(2);
            var messageHandler;
            before(function(done) {
                client2.setAlias(alias, function(err) {
                    expect(err).to.be.a('null');
                    done();
                });
            });
            it('should work', function(done) {
                messageHandler = function(data) {
                    if (data.presence) {
                        expect(data.presence.action).to.be.eq('leave');
                        expect(data.presence.alias).to.be.eq(alias);
                        done();
                    }
                }
                client2.subscribe({
                    topic: topic
                }, function(err) {
                    expect(err).to.be.a('null');
                    client1.subscribePresence({
                        topic: topic,
                        messageHandler: messageHandler
                    }, function(err) {
                        expect(err).to.be.a('null');
                        client2.unsubscribe({
                            topic: topic
                        }, function(err) {
                            expect(err).to.be.a('null');
                        });
                    });
                });
            });
            after(function(done) {
                client1.unsubscribePresence({
                    topic: topic,
                    messageHandler: messageHandler
                }, function(err) {
                    expect(err).to.be.a('null');
                    done();
                });
            });
        });

        describe('#online msg', function() {
            var topic = 'topic' + Math.random().toString().substr(2);
            var alias = 'alias' + Math.random().toString().substr(2);
            var messageHandler;
            before(function(done) {
                client2.setAlias(alias, function(err) {
                    expect(err).to.be.a('null');
                    client2.subscribe({
                        topic: topic
                    }, function(err) {
                        expect(err).to.be.a('null');
                        client2.disconnect(function(err) {
                            expect(err).to.be.a('null');
                            // skip offline msg
                            setTimeout(function() {
                                done();
                            }, 1000)
                        });
                    });
                });
            });
            it('should work', function(done) {
                messageHandler = function(data) {
                    if (data.presence) {
                        expect(data.presence.action).to.be.eq('online');
                        expect(data.presence.alias).to.be.eq(alias);
                        done();
                    }
                }
                client1.subscribePresence({
                    topic: topic,
                    messageHandler: messageHandler
                }, function(err) {
                    expect(err).to.be.a('null');
                    // connect again
                    client2.connectSocketio();
                    client2.connectMqtt();
                });
            });
            after(function(done) {
                client1.unsubscribePresence({
                    topic: topic,
                    messageHandler: messageHandler
                }, function(err) {
                    expect(err).to.be.a('null');
                    done();
                });
            });
        });

        describe('#offline msg', function() {
            var topic = 'topic' + Math.random().toString().substr(2);
            var alias = 'alias' + Math.random().toString().substr(2);
            var messageHandler;
            before(function(done) {
                client2.setAlias(alias, function(err) {
                    expect(err).to.be.a('null');
                    client2.subscribe({
                        topic: topic
                    }, function(err) {
                        expect(err).to.be.a('null');
                        done();
                    });
                });
            });
            it('should work', function(done) {
                messageHandler = function(data) {
                    if (data.presence) {
                        expect(data.presence.action).to.be.eq('offline');
                        expect(data.presence.alias).to.be.eq(alias);
                        done();
                    }
                }
                client1.subscribePresence({
                    topic: topic,
                    messageHandler: messageHandler
                }, function(err) {
                    expect(err).to.be.a('null');
                    client2.disconnect();
                });
            });
            after(function(done) {
                client1.unsubscribePresence({
                    topic: topic,
                    messageHandler: messageHandler
                }, function(err) {
                    expect(err).to.be.a('null');
                    done();
                });
            });
        });
    });


    after(function(done) {
        var count = 0;
        var total = 0;
        function _add() {
            total++;
        }
        function _done() {
            count++;
            if (count == 2) {
                return done();
            }
        }

        _add();
        client1.connectSocketio();
        client1.connectMqtt();
        client1.getTopicList('', function(err, result) {
            result.data.topics.forEach(function(topic) {
                client1.unsubscribe({topic: topic});
            });
            client1.disconnect(function(err) {
                _done();
            });
        });

        _add();
        client2.connectSocketio();
        client2.connectMqtt();
        client2.getTopicList('', function(err, result) {
            result.data.topics.forEach(function(topic) {
                client2.unsubscribe({topic: topic});
            });
            client2.disconnect(function(err) {
                _done();
            });
        });

    });
});