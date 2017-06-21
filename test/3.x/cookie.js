function mockWindow() {
    var window = {
        navigator: {
            cookieEnabled: true
        },
        document: {
            cookie: ''
        },
        location: {
            href: ''
        }
    }
    global.window = window;
    global.location = window.location;
    global.navigator = window.navigator;
    global.document = window.document;
    window.window = window;
}

function unMockWindow() {
    window.window = undefined;
    global.window = undefined;
    global.location = undefined;
    global.navigator = undefined;
    global.document = undefined;
}
// ==============
var expect = require('chai').expect;
var options = require('./_config.js').options;
options.customId = 'uid_base_' + Math.random().toString().substr(-5);

var Yunba;

describe('#cookie', function() {

    before(function() {
        mockWindow();
        delete require.cache[require.resolve('../../yunba-js-sdk-v3.js')];
        Yunba = require('../../yunba-js-sdk-v3.js');
    });

    describe('#cookieUtil', function() {
        it('#isSupport & set & get', function(done) {
            var cookieUtil = Yunba._cookieUtil;
            var value = Math.random().toString().substr(-5);
            var name = 'cookie_name' + Math.random().toString().substr(-5);
            expect(cookieUtil.isSupport()).to.be.true;
            cookieUtil.set(name, value);
            expect(cookieUtil.get(name)).to.be.eq(value);
            done();
        });
    });

    after(function() {
        unMockWindow();
        delete require.cache[require.resolve('../../yunba-js-sdk-v3.js')];
    });

});