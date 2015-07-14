var Yunba;
//var DEF_SERVER = 'sock.yunba.io';
//var DEF_PORT = 3000;
var DEF_SERVER = 'abj-mongo-2.yunba.io';
var DEF_PORT = 5555;
var QOS0 = 0;
var QOS1 = 1;
var QOS2 = 2;
var MSG_MISSING_MESSAGE = 'Missing Message';
var MSG_MISSING_CHANNEL = 'Missing Channel';
var MSG_MISSING_ALIAS = 'Missing Alias';
var MSG_SUB_FAIL = '订阅失败';
var MSG_MISSING_CALLBACK = 'Missing Callback';
var MSG_SUB_REPEAT_ERROR = '不能重复订阅一个频道';
var MSG_UNSUB_FAIL = '取消订阅操作失败';
var MSG_CONNECT_FAIL = '连接 Yunba 服务失败';
var MSG_DISCONNECT_FAIL = '关闭连接失败';
var MSG_NO_THIS_CHANNEL = '未订阅该频道';
var MSG_PUB_FAIL = '信息发布失败';
var MSG_NEED_CONNECT = '请先连接到 Yunba 服务';
var MSG_NEED_SOCKET_CONNECT = 'JavaScript SDK 与消息服务器已经断开链接，请刷新页面重新链接。';
var MSG_SESSION_IN_USE = 'the session id is in use';

var __error = function (msg) {
    __log(msg);
    return true;
};

var __log = function (msg) {
    if (typeof console != "undefined" && typeof console.log != "undefined") {
        console.log(msg);
    }
};

var __MessageIdUtil = {
    get: function () {
        var randomness = Math.round(Math.random() * 1e16) % Math.pow(2, 23);

        if (randomness.toString(2).length > 23) {
            randomness = (randomness >>> (randomness.toString(2).length - 23)).toString(2);
        } else {
            randomness = (randomness << (23 - randomness.toString(2).length)).toString(2);
        }

        var timestamp = (new Date().getTime()).toString(2);

        return parseInt(timestamp, 2).toString() + parseInt(randomness, 2).toString();
    }
};

var __CookieUtil = {
    get: function (name) {
        var cookieName = encodeURIComponent(name) + "=",
            cookieStart = document.cookie.indexOf(cookieName),
            cookieValue = null;

        if (cookieStart > -1) {
            var cookieEnd = document.cookie.indexOf(';', cookieStart);
            if (cookieEnd == -1) {
                cookieEnd = document.cookie.length;
            }
            cookieValue = decodeURIComponent(document.cookie.substring(cookieStart + cookieName.length, cookieEnd));
        }
        return cookieValue;
    },

    set: function (name, value, expires, path, domain, secure) {
        var cookieText = encodeURIComponent(name) + '=' + encodeURIComponent(value);

        if (expires instanceof Date) {
            cookieText += "; expires=" + expires.toGMTString();
        }

        if (path) {
            cookieText += "; path=" + path;
        }

        if (domain) {
            cookieText += "; domain=" + domain;
        }

        if (secure) {
            cookieText += "; secure";
        }

        document.cookie = cookieText;
    },

    unset: function (name, path, domain, secure) {
        this.set(name, '', new Date(0), path, domain, secure);
    },

    isSupport: function () {
        var isSupport = false;
        if (typeof(navigator.cookieEnabled) != 'undefined') {
            isSupport = navigator.cookieEnabled;
        } else {
            this.set('yunbaTestCookie', 'yunbaTestCookie');
            isSupport = this.get('yunbaTestCookie') ? true : false;
        }
        return isSupport;
    }
};

Array.prototype.contain = function (val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) {
            return true;
        }
    }
    return false;
};

Array.prototype.indexOf = function (val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};

Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

Yunba = (function () {

    function Yunba(setup) {
        setup = setup || {};
        this.server = setup['server'] || DEF_SERVER;
        this.port = setup['port'] || DEF_PORT;
        this.auto_reconnect = setup['auto_reconnect'] || false;
        if (!setup['appkey']) {
            return false;
        } else {
            this.appkey = setup['appkey'];
        }

        this.connected = false;//mqtt连接状态
        this.socket_connected = false;//socket.io连接状态
    }

    Yunba.prototype.init = function (init_callback, rec_callback) {
        var me = this;
        init_callback = init_callback || function () {
            };
        rec_callback = rec_callback || function () {
            };
        me.message_cb = function () {
        };
//        me.receive_msg_cb_list = {};
        me.puback_cb = {};
        me.suback_cb = {};
        me.unsuback_cb = {};
        me.get_alias_cb = function () {
        };
        me.set_alias_cb = function () {
        };
        me.get_state_cb = function () {
        };
        me.get_alias_list_cb = function () {
        };
        me.get_topic_list_cb = function () {
        };

        var socketio_connect = function () {
            try {
                __log('js client start init...');
                me.socket = io.connect('http://' + me.server + ':' + me.port, {'force new connection': true});
                me.socket.on('connect', function () {
                    __log('js client init success.');
                    me.socket_connected = true;
                    init_callback(true);
                });

                me.socket.on('error', function (e) {
                    if (me.auto_reconnect) {
                        setTimeout(function () {
                            socketio_connect();
                        }, 1000);
                    } else {
                        __log('js client init error:', e);
                        me.socket_connected = false;
                        init_callback(false);
                    }
                });

                me.socket.on('disconnect', function () {
                    if (me.auto_reconnect) {
                        setTimeout(function () {
                            socketio_connect();
                        }, 1000);
                    } else {
                        __log('js client disconnect.');
                        me.socket_connected = false;
                        init_callback(false);
                    }
                });
                me.socket.on('reconnect', function () {
                    __log('js client reconnect.');
                    if (rec_callback) {
                        rec_callback();
                    }
                });
                me.socket.on('reconnect_failed', function () {
                    if (me.auto_reconnect) {
                        setTimeout(function () {
                            socketio_connect();
                        }, 1000);
                    } else {
                        __log('js client reconnect failed.');
                    }
                });

                me.socket.on('puback', function (result) {
                    if (result.success && me.puback_cb[result.messageId]) {
                        me.puback_cb[result.messageId](true, {messageId: result.messageId});
                    } else {
                        if (me.puback_cb[result.messageId]) {
                            me.puback_cb[result.messageId](false, MSG_PUB_FAIL);
                        }
                        return __error(MSG_PUB_FAIL);
                    }
                });

                me.socket.on('message', function (data) {
                    me.message_cb(data);
                });

                me.socket.on('alias', function (data) {
                    me.get_alias_cb(data);
                });

                me.socket.on('set_alias_ack', function (data) {
                    me.set_alias_cb(data);
                });

                me.socket.on('suback', function (result) {
                    if (result.success) {
                        me.suback_cb[result.messageId](true);
                    } else {
                        me.suback_cb[result.messageId](false, MSG_SUB_FAIL);
                        return __error(MSG_SUB_FAIL);
                    }
                });

                me.socket.on('unsuback', function (result) {
                    if (result.success) {
                        me.unsuback_cb[result.messageId](true);
                    } else {
                        me.unsuback_cb[result.messageId](false, MSG_UNSUB_FAIL);
                        return __error(MSG_UNSUB_FAIL);
                    }
                });

                me.socket.on('connack', function (result) {
                    if (result.success) {
                        me.connected = true;
                        if (me.connack_cb)
                            me.connack_cb(true, null, result.sessionid);
                    } else {
                        if (MSG_SESSION_IN_USE === result.msg) {
                            // try again after 1s
                            setTimeout(function () {
                                init_callback(true);
                            }, 1000);
                        } else {
                            if (me.connack_cb) {
                                me.connack_cb(false, result.msg);
                            }
                        }
                    }
                });

                me.socket.on('get_state_ack', function (data) {
                    me.get_state_cb(data);
                });

                me.socket.on('get_topic_list_ack', function (result) {
                    if (result.success) {
                        if (me.get_topic_list_cb) {
                            me.get_topic_list_cb(true, {
                                topics: result.data.topics
                            });
                        }

                    } else {
                        if (me.get_topic_list_cb) {
                            me.get_topic_list_cb(false, {
                                error_msg: result.error_msg,
                                messageId: result.messageId
                            });
                        }
                    }
                });

                me.socket.on('get_alias_list_ack', function (result) {
                    if (result.success) {
                        if (me.get_alias_list_cb) {
                            me.get_alias_list_cb(true, {
                                alias: result.data.alias
                            });
                        }

                    } else {
                        if (me.get_alias_list_cb) {
                            me.get_alias_list_cb(false, {
                                error_msg: result.error_msg,
                                messageId: result.messageId
                            });
                        }
                    }
                });

            } catch (err) {
                if (me.auto_reconnect) {
                    setTimeout(function () {
                        socketio_connect();
                    }, 1000);
                } else {
                    return __error(MSG_CONNECT_FAIL) && init_callback(false, MSG_CONNECT_FAIL);
                }
            }
        };

        socketio_connect();
    };

    Yunba.prototype.connect = function (callback) {

        if (this.socket_connected === false) {
            return false;
        }
        this.connack_cb = callback;

        try {
            if (__CookieUtil.isSupport()) {
                var customid = __CookieUtil.get('YUNBA_CUSTOMID_COOKIE');
                if (!customid) {
                    customid = "uid_" + (new Date()).getTime() + parseInt(Math.random() * 10000);
                    __CookieUtil.set('YUNBA_CUSTOMID_COOKIE', customid, new Date('January 1, 2100'));
                }
                this.socket.emit('connect_v2', {appkey: this.appkey, customid: customid});

            } else {
                this.socket.emit('connect_v2', {appkey: this.appkey});
            }

        } catch (err) {
            return __error(err) && callback(false, err);
        }
    };

    Yunba.prototype.connect_by_customid = function (customid, callback) {
        if (this.socket_connected === false) {
            return false;
        }
        this.connack_cb = callback;

        try {
            this.socket.emit('connect_v2', {appkey: this.appkey, customid: customid});
        } catch (err) {
            return __error(err) && callback(false, err);
        }
    };

    Yunba.prototype.disconnect = function (callback) {
        var self = this;
        if (!self.connected) {
            callback && callback(true);
            return;
        }
        try {
            this.socket.emit('disconn', {});
            self.connected = false;
            callback && callback(true);
        } catch (err) {
            return __error(err) && callback(false, err);
        }
    };

    Yunba.prototype.set_message_cb = function (cb) {
        this.message_cb = cb;
    };

    Yunba.prototype.subscribe = function (args, callback) {

        if (this.socket_connected === false) {
            return false;
        }

        var channel = args['topic'];
        var qos = args['qos'] || QOS1;
        var msgId = args['messageId'] || __MessageIdUtil.get();
        this.suback_cb[msgId.toString()] = args['callback'] || callback || function () {
            };

        if (!this.connected) {
            return __error(MSG_NEED_CONNECT) && callback(false, MSG_NEED_CONNECT);
        }

        if (!channel)  return __error(MSG_MISSING_CHANNEL) && callback(false, MSG_MISSING_CHANNEL);

        try {
            this.socket.emit('subscribe', {'topic': channel, 'qos': qos, 'messageId': msgId});
        } catch (err) {
            return __error(err) && callback(false, err);
        }

    };

    Yunba.prototype.unsubscribe = function (args, callback) {

        if (this.socket_connected === false) {
            return false;
        }

        if (!this.connected) {
            return __error(MSG_NEED_CONNECT) && callback(false, MSG_NEED_CONNECT);
        }

        var channel = args['topic'];
        var msgId = args['messageId'] || __MessageIdUtil.get();
        this.unsuback_cb[msgId.toString()] = args['callback'] || callback || function () {
            };

        if (!channel)  return __error(MSG_MISSING_CHANNEL) && callback(false, MSG_MISSING_CHANNEL);

        try {
            this.socket.emit('unsubscribe', {'topic': channel, 'messageId': msgId});
        } catch (err) {
            return __error(err) && callback(false, err);
        }
    };

    Yunba.prototype.publish = function (args, callback) {

        if (this.socket_connected === false) {
            return false;
        }

        if (!this.connected) {
            return __error(MSG_NEED_CONNECT) && callback(false, MSG_NEED_CONNECT);
        }

        var channel = args['topic'] || args['channel'];
        var msg = args['msg'];
        var qos = args['qos'] || QOS1;
        var msgId = args['messageId'] || __MessageIdUtil.get();

        this.puback_cb[msgId.toString()] = callback;

        var callback = args['callback'] || callback || function () {
            };

        if (!channel) return __error(MSG_MISSING_CHANNEL) && callback(false, MSG_MISSING_CHANNEL);
        if (!msg)     return __error(MSG_MISSING_MESSAGE) && callback(false, MSG_MISSING_MESSAGE);


        try {
            this.socket.emit('publish', {'topic': channel, 'msg': msg, 'qos': qos, 'messageId': msgId});
        } catch (err) {
            return __error(err) && callback(false, err);
        }
    };

    Yunba.prototype.publish2 = function (args, callback) {

        if (this.socket_connected === false) {
            return false;
        }

        if (!this.connected) {
            return __error(MSG_NEED_CONNECT) && callback(false, MSG_NEED_CONNECT);
        }

        var topic = args['topic'] || args['channel'];
        var msg = args['msg'];
        var opts = args['opts'] || {
                'qos': QOS1
            };
        opts['messageId'] = opts['messageId'] || __MessageIdUtil.get();

        this.puback_cb[opts['messageId'].toString()] = callback;

        var callback = args['callback'] || callback || function () {
            };

        if (!topic) {
            return __error(MSG_MISSING_CHANNEL) && callback(false, MSG_MISSING_CHANNEL);
        } else if (!msg) {
            return __error(MSG_MISSING_MESSAGE) && callback(false, MSG_MISSING_MESSAGE);
        }

        try {
            this.socket.emit('publish2', {'topic': topic, 'msg': msg, 'opts': opts});
        } catch (err) {
            return __error(err) && callback(false, err);
        }
    };

    Yunba.prototype.publish_to_alias = function (args, callback) {
        args['messageId'] = args['messageId'] || __MessageIdUtil.get();
        this.puback_cb[args['messageId'].toString()] = callback;
        this.socket.emit('publish_to_alias', args);
    };

    Yunba.prototype.publish2_to_alias = function (args, callback) {

        if (this.socket_connected === false) {
            return false;
        }

        if (!this.connected) {
            return __error(MSG_NEED_CONNECT) && callback(false, MSG_NEED_CONNECT);
        }

        var alias = args['alias'];
        var msg = args['msg'];
        var opts = args['opts'] || {
                'qos': QOS1
            };
        opts['messageId'] = opts['messageId'] || __MessageIdUtil.get();
        this.puback_cb[opts['messageId'].toString()] = callback;

        var callback = args['callback'] || callback || function () {
            };

        if (!alias) {
            return __error(MSG_MISSING_ALIAS) && callback(false, MSG_MISSING_ALIAS);
        } else if (!msg) {
            return __error(MSG_MISSING_ALIAS) && callback(false, MSG_MISSING_ALIAS);
        }

        try {
            this.socket.emit('publish2_to_alias', {'alias': alias, 'msg': msg, 'opts': opts});
        } catch (err) {
            return __error(err) && callback(false, err);
        }

    };

    Yunba.prototype.set_alias = function (args, callback) {
        this.set_alias_cb = callback;
        this.socket.emit('set_alias', args);
    };

    Yunba.prototype.get_alias = function (callback) {
        this.get_alias_cb = callback;
        this.socket.emit('get_alias');
    };

    Yunba.prototype.get_state = function (alias, callback) {
        this.get_state_cb = callback;
        this.socket.emit('get_state', {'alias': alias});
    };

    Yunba.prototype.get_topic_list = function (alias, callback) {
        this.get_topic_list_cb = callback;
        this.socket.emit('get_topic_list', {'alias': alias});
    };

    Yunba.prototype.get_alias_list = function (topic, callback) {
        this.get_alias_list_cb = callback;
        this.socket.emit('get_alias_list', {'topic': topic});
    };

    Yunba.prototype._update_query_string = function (new_query_string) {
        var href = location.href;
        var rurl = (href.indexOf('?') ? href.substr(0, href.indexOf('?')) : href) + new_query_string;
        if (history && typeof history.replaceState === "function") {
            history.replaceState(null, null, rurl);
        } else {
            location.href = rurl;
        }
    };

    return Yunba;

})();