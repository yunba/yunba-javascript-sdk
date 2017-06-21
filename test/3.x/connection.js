var expect = require('chai').expect;
var Yunba = require('../../yunba-js-sdk-v3.js');
var options = require('./_config.js').options;
options.customId = 'uid_base_' + Math.random().toString().substr(-5);

var client;

describe('#connection', function() {

    describe('#connectSocketio', function() {
        var client, opts;
        it('should success', function(done) {
            this.timeout(20000);
            opts = JSON.parse(JSON.stringify(options));
            opts.autoConnect = false;
            client = new Yunba(opts);
            client.connectSocketio(function(err, result) {
                expect(err).to.be.a('null');
                done();
            });
        });
    });

    describe('#connectMqtt ', function() {

        describe('with an invalid appkey', function() {
            var client, opts;
            it('should fail', function(done) {
                opts = JSON.parse(JSON.stringify(options));
                opts.autoConnect = false;
                opts.appkey = 'invalid-appkey';
                client = new Yunba(opts);
                client.connectSocketio(function(err, result) {
                    client.connectMqtt(function(err, result) {
                        expect(err).to.be.an('error');
                        done();
                    });
                });
            });
        });

        describe('with a valid appkey', function() {
            var client, opts;
            it('should success', function(done) {
                opts = JSON.parse(JSON.stringify(options));
                opts.autoConnect = false;
                client = new Yunba(opts);
                client.connectSocketio(function(err, result) {
                    client.connectMqtt(function(err, result) {
                        expect(err).to.be.a('null');
                        done();
                    });
                });
            });
        });

    });

    describe('#disconnect ', function() {
        var client, opts;
        it('should success', function(done) {
            opts = JSON.parse(JSON.stringify(options));
            opts.autoConnect = false;
            client = new Yunba(opts);
            client.connectSocketio(function(err, result) {
                client.connectMqtt(function(err, result) {
                    expect(client.mqttState).to.be.eq('connected');
                    client.disconnect(function(err) {
                        expect(err).to.be.a('null');
                        done();
                    });
                });
            });
        });
    });

});
