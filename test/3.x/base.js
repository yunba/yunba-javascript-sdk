var expect = require('chai').expect;
var Yunba = require('../../yunba-js-sdk-v3.js');
var options = require('./_config.js').options;
options.customId = 'uid_base_' + Math.random().toString().substr(-5);

var client;

describe('#base', function() {

    before(function(done) {
        client = new Yunba(options);
        client.connectMqtt(function(err) {
            if (err) {
                throw err;
            }
            done();
        });
    });

    describe('#subscribe', function() {
        describe('subscribe to an topic with a valid name', function() {
            var topic = 'topic' + Math.random().toString().substr(2);
            it('should success', function(done) {
                client.subscribe({
                    topic: topic
                }, function(err, result) {
                   expect(err).to.be.a('null');
                   done();
                });
            });
            after(function() {
                client.unsubscribe({
                    topic: topic
                });
            });
        });

        describe('subscribe to an topic with emty topic name', function() {
            it('should fail', function(done) {
                client.subscribe({
                    topic: ''
                }, function(err, result) {
                    expect(err).to.be.an('error');
                    done();
                });
            });
        });
    });


    describe('#unsubscribe', function() {
        describe('unsubscribe to an subscribed topic', function() {
            it('should success', function(done) {
                var topic = 'topic' + Math.random().toString().substr(2);
                client.subscribe({topic: topic}, function(err) {
                    if (err) {
                        throw err;
                    }
                    client.unsubscribe({
                        topic: topic
                    }, function(err, result) {
                        expect(err).to.be.a('null');
                        done();
                    });

                });
            });
        });

        describe('after unsubscribed, all messageHandlers of the topic', function() {
            it('should be removed', function(done) {
                var topic = 'topic' + Math.random().toString().substr(2);
                client.subscribe({topic: topic}, function(err) {
                    if (err) {
                        throw err;
                    }
                    var topicObject = client.topics[topic];
                    expect(topicObject).to.be.an('object');
                    expect(topicObject.messageHandlers.length).to.be.gt(0);
                    client.unsubscribe({
                        topic: topic
                    }, function(err, result) {
                        expect(err).to.be.a('null');
                        expect(topicObject.messageHandlers.length).to.be.eq(0);
                        done();
                    });
                });
            });
        });

        describe('after unsubscribed with a messageHandler, this messageHandler', function() {
            this.timeout(40000);
            it('should be removed from messageHandlers of the topic', function(done) {
                var topic = 'topic' + Math.random().toString().substr(2);
                var messageHandler = function() {};
                client.subscribe({
                    topic: topic
                }, function(err) {
                    expect(err).to.be.a('null');
                    client.subscribe({
                        topic: topic,
                        messageHandler: messageHandler
                    }, function(err) {
                        var topicObject = client.topics[topic];
                        expect(err).to.be.a('null');
                        expect(topicObject).to.be.an('object');
                        expect(topicObject.messageHandlers.indexOf(messageHandler)).to.be.gt(-1);
                        client.unsubscribe({
                            topic: topic
                        }, function(err, result) {
                            expect(err).to.be.a('null');
                            expect(client.topics[topic].messageHandlers.indexOf(messageHandler)).to.be.eq(-1);
                            done();
                        });
                    });
                });
            });
        });
    });

    describe('#publish', function() {

        describe('publish to an unsubscribed topic', function(done) {
            it('should success', function(done) {
                var topic = 'topic' + Math.random().toString().substr(2);
                client.publish({
                    topic: topic,
                    msg: 'this a testing message'
                }, function(err, result) {
                    expect(err).to.be.a('null');
                    done();
                });
            });
        });

        describe('publish to a subscribed topic - v1', function(done) {
            it('should success', function(done) {
                var topic = 'topic' + Math.random().toString().substr(2);
                // before
                client.subscribe({topic: topic}, function(err) {
                    if (err) {
                        throw err;
                    }
                    client.publish({
                        topic: topic,
                        msg: 'this a testing message'
                    }, function(err, result) {
                        expect(err).to.be.a('null');
                        done();
                    });
                });
            });
        });

        describe('publish to alias - v1', function(done) {
            it('should success', function(done) {
                var alias = 'alias' + Math.random().toString().substr(2);
                var msg = 'msg' + Math.random().toString().substr(2);
                var originMessageHandler = client.messageHandler;
                client.messageHandler = function(data) {
                    if (data.topic == alias) {
                        expect(data.msg).to.be.eq(msg);
                        done();
                    }
                };

                client.setAlias(alias, function(err, result) {
                    expect(err).to.be.a('null');
                    client.publishToAlias({
                        alias: alias,
                        msg: msg
                    }, function(err, result) {
                        expect(err).to.be.a('null');
                    });
                });

                after(function() {
                    client.messageHandler = originMessageHandler;
                });
            });
        });

        describe('publish2 to an subscribed topic', function(done) {
            it('should success', function(done) {
                var topic = 'topic' + Math.random().toString().substr(2);
                // before
                client.subscribe({topic: topic}, function(err) {
                    if (err) {
                        throw err;
                    }
                    // v2
                    client.publish2({
                        topic: topic,
                        msg: 'this a testing message',
                        opts: {
                            qos: 1,
                            time_to_live: 36000,
                            apn_json: {
                                aps: {
                                    sound: 'bingbong.aiff',
                                    badge: 3,
                                    alert: 'yunba'
                                }
                            }
                        }
                    }, function(err, result) {
                        expect(err).to.be.a('null');
                        done();
                    });
                });
            });
        });

        describe('publish2 to alias', function(done) {
            it('should success', function(done) {
                var alias = 'alias' + Math.random().toString().substr(2);
                var msg = 'msg' + Math.random().toString().substr(2);
                var opts = {
                    'qos': 1,
                    'time_to_live': 36000,
                    'apn_json': {
                        'aps': {'sound': 'bingbong.aiff', 'badge': 3, 'alert': 'yunba'}
                    }
                }
                var originMessageHandler = client.messageHandler;
                client.messageHandler = function(data) {
                    if (data.topic == alias) {
                        expect(data.msg).to.be.eq(msg);
                        done();
                    }
                };

                client.setAlias(alias, function(err, result) {
                    expect(err).to.be.a('null');
                    client.publish2ToAlias({
                        alias: alias,
                        msg: msg,
                        opts: opts
                    }, function(err, result) {
                        expect(err).to.be.a('null');
                    });
                });

                after(function() {
                    client.messageHandler = originMessageHandler;
                });

            });
        });

    });

    describe('#common message handler', function() {
        it('should work', function(done) {
            var call = 0;
            var topic = 'topic' + Math.random().toString().substr(2);
            var originMessageHandler = client.messageHandler;
            client.messageHandler = function(data) {
                if (data.topic == topic) {
                    call++;
                }
            }
            client.subscribe({
                topic: topic
            }, function(err) {
                client.publish({
                    topic: topic,
                    msg: 'test message'
                }, function() {
                    setTimeout(function() {
                        expect(call).to.be.eq(1);
                        done();
                    }, 5000);
                });
            });

            after(function() {
                client.messageHandler = originMessageHandler;
                client.unsubscribe({
                    topic: topic
                });
            });
        });
    });

    describe('#topic message handler', function() {
        it('should work', function(done) {
            var cCall = 0, tCall = 0;
            var topic = 'topic' + Math.random().toString().substr(2);
            var originMessageHandler = client.messageHandler;
            var commomMessageHandler = function(data) {
                if (data.topic == topic) {
                    cCall++;
                }
            }
            var topicMessageHandler = function(data) {
                if (data.topic == topic) {
                    tCall++;
                }
            }
            client.messageHandler = commomMessageHandler;
            client.subscribe({
                topic: topic,
                messageHandler: topicMessageHandler
            }, function(err) {
                client.publish({
                    topic: topic,
                    msg: 'test message'
                }, function() {
                    setTimeout(function() {
                        expect(cCall).to.be.eq(0);
                        expect(tCall).to.be.eq(1);
                        done();
                    }, 5000);
                });
            });

            after(function() {
                client.messageHandler = originMessageHandler;
                client.unsubscribe({
                    topic: topic
                });
            });
        });
    });

    describe('#alias', function() {
        var alias = 'alias' + Math.random().toString().substr(2);
        describe('set alias', function() {
            it('should work', function(done) {
                client.setAlias(alias, function(err) {
                    expect(err).to.be.a('null');
                    done();
                });
            });
        });

        describe('get alias', function() {
            it('should work', function(done) {
                client.getAlias(function(err, result) {
                    expect(err).to.be.a('null');
                    expect(result.alias).to.be.eq(alias);
                    done();
                });
            });
        })
    });

    describe('#get state', function() {
        it('should work', function(done) {
            var topic = 'topic' + Math.random().toString().substr(2);
            var alias = 'alias' + Math.random().toString().substr(2);
            client.subscribe({
                topic: topic,
            }, function(err) {
                client.setAlias(alias, function(err) {
                    expect(err).to.be.a('null');
                    client.getState(alias, function(err, result) {
                        expect(err).to.be.a('null');
                        expect(result.data).to.be.eq('online');
                        done();
                    });
                });
            });

            after(function() {
                client.unsubscribe({
                    topic: topic
                });
            });
        });
    });


    describe('#get topic list', function() {
        it('should work', function(done) {
            var topic = 'topic' + Math.random().toString().substr(2);
            var alias = 'alias' + Math.random().toString().substr(2);
            client.subscribe({
                topic: topic,
            }, function(err) {
                client.setAlias(alias, function(err) {
                    expect(err).to.be.a('null');
                    client.getTopicList(alias, function(err, result) {
                        expect(err).to.be.a('null');
                        expect(result.data.topics).to.be.an('array');
                        done();
                    });
                });
            });

            after(function() {
                client.unsubscribe({
                    topic: topic
                });
            });
        });
    });

    describe('#get alias list', function() {
        it('should work', function(done) {
            var topic = 'topic' + Math.random().toString().substr(2);
            var alias = 'alias' + Math.random().toString().substr(2);
            client.subscribe({
                topic: topic,
            }, function(err) {
                client.setAlias(alias, function(err) {
                    expect(err).to.be.a('null');
                    client.getAliasList(topic, function(err, result) {
                        expect(err).to.be.a('null');
                        expect(result.data.alias).to.be.an('array');
                        done();
                    });
                });
            });

            after(function() {
                client.unsubscribe({
                    topic: topic
                });
            });
        });
    });

    after(function(done) {
        client.connectSocketio();
        client.connectMqtt();
        client.getTopicList('', function(err, result) {
            result.data.topics.forEach(function(topic) {
                client.unsubscribe({topic: topic});
            });
            client.disconnect(function(err) {
                done();
            });
        });
    });

});