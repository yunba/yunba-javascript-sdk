var expect = require('chai').expect;
var Yunba = require('../../yunba-js-sdk.js');
var config = require('./_config.js');
var options = config.options;

var client;
var customId = 'uid_index_' + Math.random().toString().substr(-5);
before(function(done) {
    client = new Yunba(options);
    var called;
    client.init(function (success) {
        if (called) {
            return;
        }
        called = true;
        if (success) {
            client.connect_by_customid(customId, function(success, msg, sessionId) {
                if (success) {
                    done();
                }
            });
        }
    });
});

describe('#subscribe', function() {
    describe('subscribe to an topic with a valid name', function() {
        var topic = 'topic' + Math.random().toString().substr(2);
        it('should success', function(done) {
            client.subscribe({
                topic: topic
            }, function(success) {
               expect(success).to.be.true;
               done();
            });
        });
        after(function() {
            client.unsubscribe({
                topic: topic
            });
        });
    });
});

describe('#unsubscribe', function() {
    describe('unsubscribe to a subscribed topic', function() {
        var topic = 'topic' + Math.random().toString().substr(2);
        it('should success', function(done) {
            client.subscribe({
                topic: topic
            }, function(success) {
               expect(success).to.be.true;
               client.unsubscribe({
                    topic: topic
               }, function(success, msg) {
                    expect(success).to.be.true;
                    done();
               });
            });
        });
    });
});

describe('#set_message_cb', function() {
    describe('after set_message_cb', function() {
        it('cb should be called when receive msg', function(done) {
            var topic = 'topic' + Math.random().toString().substr(2);
            var msg = 'msg' + Math.random().toString().substr(2);
            client.set_message_cb(function(data) {
                expect(data.topic).to.be.eq(topic);
                expect(data.msg).to.be.eq(msg);
                done();
            });
            client.subscribe({
                topic: topic
            }, function(success) {
                client.publish({
                    topic: topic,
                    msg: msg
                }, function(success, msg) {
                    return;
                });
            });
        });
    });
});


describe('#publish', function() {

    describe('publish1 to an unsubscribed topic', function(done) {
        it('should success', function(done) {
            var topic = 'topic' + Math.random().toString().substr(2);
            client.publish({
                topic: topic,
                msg: 'this a testing message'
            }, function(success) {
                expect(success).to.be.true;
                done();
            });
        });
    });

    describe('publish1 to a subscribed topic', function(done) {
        it('should success', function(done) {
            var topic = 'topic' + Math.random().toString().substr(2);
            var msg = 'msg' + Math.random().toString().substr(2);

            client.set_message_cb(function(data) {
                if (data.topic == topic) {
                    expect(data.msg).to.be.eq(msg);
                    done();
                }
            });
            client.subscribe({
                topic: topic
            }, function(success) {
                expect(success).to.be.true;
                client.publish({
                    topic: topic,
                    msg: msg
                }, function(success) {
                    expect(success).to.be.true;
                });
            });

            after(function() {
                client.set_message_cb(null);
            });
        });
    });

    describe('publish2 to an unsubscribed topic', function(done) {
        it('should success', function(done) {
            var topic = 'topic' + Math.random().toString().substr(2);
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
            }, function(success) {
                expect(success).to.be.true;
                done();
            });
        });
    });

    describe('publish2 to an subscribed topic', function(done) {
        it('should success', function(done) {
            var topic = 'topic' + Math.random().toString().substr(2);
            var msg = 'msg' + Math.random().toString().substr(2);
            client.set_message_cb(function(data) {
                if (data.topic == topic) {
                    expect(data.msg).to.be.eq(msg);
                    done();
                }
            });
            client.subscribe({topic: topic}, function(success) {
                expect(success).to.be.true;
                // v2
                client.publish2({
                    topic: topic,
                    msg: msg,
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
                }, function(success) {
                    expect(success).to.be.true;
                });

            });

            after(function() {
                client.set_message_cb(null);
            });
        });
    });

    describe('publish1 to alias', function(done) {
        it('should success', function(done) {
            var alias = 'alias' + Math.random().toString().substr(2);
            var msg = 'msg' + Math.random().toString().substr(2);
            client.set_message_cb(function(data) {
                expect(data.msg).to.be.eq(msg);
                done();
            });

            client.set_alias({alias: alias}, function(data) {
                expect(data.success).to.be.true;
                client.publish_to_alias({
                    alias: alias,
                    msg: msg
                }, function(success) {
                    expect(success).to.be.true;
                });
            });

            after(function() {
                client.set_message_cb(null);
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
                    'aps': {
                        'sound': 'bingbong.aiff',
                        'badge': 3,
                        'alert': 'yunba'
                    }
                }
            }
            client.set_message_cb(function(data) {
                expect(data.msg).to.be.eq(msg);
                done();
            });

            client.set_alias({alias: alias}, function(data) {
                expect(data.success).to.be.true;
                client.publish2_to_alias({
                    alias: alias,
                    msg: msg,
                    opts: opts
                }, function(success) {
                    expect(success).to.be.true;
                });
            });

            after(function() {
                client.set_message_cb(null);
            });
        });
    });
});


describe('#alias', function() {
    var alias = 'alias' + Math.random().toString().substr(2);
    describe('set alias', function() {
        it('should work', function(done) {
            client.set_alias({alias: alias}, function(data) {
                expect(data.success).to.be.true;
                done();
            });
        });
    });

    describe('get alias', function() {
        it('should work', function(done) {
            client.get_alias(function(data) {
                expect(data.alias).to.be.eq(alias);
                done();
            });
        });
    })
});

describe('#get state', function() {
    it('should work', function(done) {
        var topic = 'topic' + Math.random().toString().substr(2);
        var alias = 'alias' + Math.random().toString().substr(2);
        client.set_alias({alias: alias}, function(data) {
            expect(data.success).to.be.true;
            client.get_state(alias, function(data) {
                expect(data.success).to.be.true;
                expect(data.data).to.be.eq('online');
                done();
            });
        });
    });
});


describe('#get topic list', function() {
    it('should work', function(done) {
        var topic = 'topic' + Math.random().toString().substr(2);
        client.subscribe({
            topic: topic,
        }, function(err) {
            client.get_topic_list('', function(success, data) {
                expect(success).to.be.true;
                expect(data.topics).to.be.an('array');
                done();
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
            client.set_alias({alias: alias}, function(data) {
                expect(data.success).to.be.true;
                client.get_alias_list(topic, function(success, data) {
                    expect(success).to.be.true;
                    expect(data.alias).to.be.an('array');
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
    client.get_topic_list('', function(success, data) {
        if (success) {
            data.topics.forEach(function (topic) {
                client.unsubscribe({
                    topic: topic
                }, function() {

                });
            });
        }
        done();
    });
});

