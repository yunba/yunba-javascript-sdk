var Yunba;
var DEF_SERVER = 'sock.yunba.io';
var DEF_PORT = 3000;
var QOS0 = 0;
var QOS1 = 1;
var QOS2 = 2;
var SUB_CHANNEL_LIST = [];//已经订阅的频道或频道列表
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

var __bind = function (fn, me) {
    return function () {
        return fn.apply(me, arguments);
    };
};

var __error = function (msg) {
    console.log(msg);
    return true;
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
        rec_callback = rec_callback || function(){};
        me.message_cb = function() {};
//        me.receive_msg_cb_list = {};
        me.get_alias_cb = function() {};
        me.set_alias_cb = function() {};
        me.get_state_cb = function() {};
        me.get_alias_list_cb = function() {};
        me.get_topic_list_cb = function() {};
        me.use_sessionid = false;

		var socketio_connect = function () {
        try {
            console.log('js client start init...');
            me.socket = io.connect('http://' + me.server + ':' + me.port, {'force new connection': true});
            me.socket.on('connect', function () {
                console.log('js client init success.');
                me.socket_connected = true;
                init_callback(true);
            });

            me.socket.on('error',function(e){
			    if (me.auto_reconnect) {
				    setTimeout(function() {
				        socketio_connect();
					}, 1000);
				} else {
                    console.log('js client init error:',e);
                    me.socket_connected=false;
                    init_callback(false);
				}
            });

            me.socket.on('disconnect', function () {
			    if (me.auto_reconnect) {
				    setTimeout(function() {
				        socketio_connect();
					}, 1000);
				} else {
                	console.log('js client disconnect.');
                	me.socket_connected = false;
                	init_callback(false);
				}
            });
            me.socket.on('reconnect', function () {
                console.log('js client reconnect.');
                if (rec_callback) {
                    rec_callback();
                }
            });
            me.socket.on('reconnect_failed', function () {
			    if (me.auto_reconnect) {
				    setTimeout(function() {
				        socketio_connect();
					}, 1000);
				} else {
                    console.log('js client reconnect failed.');
				}
            });

            me.socket.on('puback', function (result) {
                if (result.success) {
                    if (me.puback_cb)
                        me.puback_cb(true, {messageId: result.messageId});
                } else {
                    if (me.puback_cb)
                        me.puback_cb(false, MSG_PUB_FAIL);
                    return __error(MSG_PUB_FAIL);
                }
            });

            me.socket.on('publish2_ack', function (result) {
                if (result.success) {
                    if (me.publish2_ack_cb)
                        me.publish2_ack_cb(true, {messageId: result.messageId});
                } else {
                    if (me.publish2_ack_cb)
                        me.publish2_ack_cb(false, MSG_PUB_FAIL);
                    return __error(MSG_PUB_FAIL);
                }
            });

            me.socket.on('message', function (data) {
                me.message_cb(data);
            });

            me.socket.on('alias', function(data) {
                me.get_alias_cb(data);
            });

            me.socket.on('set_alias_ack', function(data) {
                me.set_alias_cb(data);
            });

            me.socket.on('suback', function (data) {
                if (data.success) {
                    //如果订阅成功，则监听来自服务端的message消息
                    if (me.suback_cb)
                        me.suback_cb(true);
                } else {
                    if (me.suback_cb)
                        me.suback_cb(false, MSG_SUB_FAIL);
                    return __error(MSG_SUB_FAIL);
                }
            });

            me.socket.on('unsuback', function (result) {
                console.log(result);
                if (result.success) {
                    SUB_CHANNEL_LIST.remove(result.topic);
                    if (me.unsuback_cb)
                        me.unsuback_cb(true);
                } else {
                    if (me.unsuback_cb)
                        me.unsuback_cb(false, MSG_UNSUB_FAIL);
                    return __error(MSG_UNSUB_FAIL);
                }
            });

            me.socket.on('connack', function (result) {
                if (result.success) {
                    me.connected = true;
                    if (me.connack_cb)
                        me.connack_cb(true, null, result.sessionid);

                    if (me.use_sessionid && result.sessionid && !$.query.get('sessionid')) {
                        me._update_query_string($.query.set('sessionid', result.sessionid).toString());
                    }
                } else {
                    if (MSG_SESSION_IN_USE === result.msg) {
                        // try again after 1s
                        setTimeout(function() {
                            init_callback(true);
                        }, 1000);
                    } else {
                        if (me.connack_cb) {
                            me.connack_cb(false, result.msg);
                        }

                        if (me.use_sessionid && $.query.get('sessionid')) {
                            me._update_query_string($.query.REMOVE('sessionid').toString());
                        }
                    }
                }
            });

            me.socket.on('get_state_ack', function(data) {
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
				setTimeout(function() {
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
        if(this.socket_connected === false){
            return false;
        }
        this.connack_cb = callback;
        this.use_sessionid = false;
        
        try {
            this.socket.emit('connect', {appkey: this.appkey});
        } catch (err) {
            return __error(MSG_SOCKET_EMIT_ERROR) && callback(false, MSG_SOCKET_EMIT_ERROR);
        }
    };

    Yunba.prototype.connect_v2 = function (callback) {
        if(this.socket_connected === false){
            return false;
        }
        this.connack_cb = callback;
        this.use_sessionid = true;

        var connect_session = $.query.get('sessionid');

        try {
            if (connect_session) {
                this.socket.emit('connect', {sessionid: connect_session});
            } else {
                this.socket.emit('connect', {appkey: this.appkey});
            }
        } catch (err) {
            return __error(MSG_SOCKET_EMIT_ERROR) && callback(false, MSG_SOCKET_EMIT_ERROR);
        }
    };

    Yunba.prototype.connect_by_sessionid = function(sessionid, callback) {
        if(this.socket_connected === false){
            return false;
        }
        this.connack_cb = callback;
        this.use_sessionid = true;

        try {
            this.socket.emit('connect', {sessionid: sessionid});
        } catch (err) {
            return __error(MSG_SOCKET_EMIT_ERROR) && callback(false, MSG_SOCKET_EMIT_ERROR);
        }
    };

    Yunba.prototype.connect_by_customid = function(customid, callback) {
        if(this.socket_connected === false){
            return false;
        }
        this.connack_cb = callback;

        try {
            this.socket.emit('connect', {appkey: this.appkey, customid: customid});
        } catch (err) {
            return __error(MSG_SOCKET_EMIT_ERROR) && callback(false, MSG_SOCKET_EMIT_ERROR);
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
            return __error(MSG_SOCKET_EMIT_ERROR) && callback(false, MSG_SOCKET_EMIT_ERROR);
        }
    };

    Yunba.prototype.set_message_cb = function (cb) {
        this.message_cb = cb;
    };

    Yunba.prototype.subscribe = function (args, cb1, cb2) {

        if (this.socket_connected === false) {
            return false;
        }

        var self = this;

        var channel = args['topic'];
        var qos = args['qos'] || QOS1;
        this.suback_cb = args['callback'] || cb1 || function () {
        };

        if (!this.connected) {
            return __error(MSG_NEED_CONNECT) && this.suback_cb(false, MSG_NEED_CONNECT);
        }

        if (!this.suback_cb) return __error(MSG_MISSINGl_CALLBACK);
        if (!channel)  return __error(MSG_MISSING_CHANNEL) && this.suback_cb(false, MSG_MISSING_CHANNEL);

        //检查是否已经订阅该频道
        if (SUB_CHANNEL_LIST.contain(channel)) {
//            return __error(MSG_SUB_REPEAT_ERROR) && this.suback_cb(false, MSG_SUB_REPEAT_ERROR);
        } else {
            SUB_CHANNEL_LIST.push(channel);
        }

        try {
            this.socket.emit('subscribe', { 'topic': channel, 'qos': qos });
        } catch (err) {
            return __error(MSG_SOCKET_EMIT_ERROR) && this.suback_cb(false, MSG_SOCKET_EMIT_ERROR);
        }

    };

    Yunba.prototype.unsubscribe = function (args, callback) {

        if (this.socket_connected === false) {
            return false;
        }

        this.unsuback_cb = callback;

        if (!this.connected) {
            return __error(MSG_NEED_CONNECT) && callback(false, MSG_NEED_CONNECT);
        }

        var channel = args['topic'];
        var callback = args['callback'] || callback || function () {
            };

        if (!channel)  return __error(MSG_MISSING_CHANNEL) && callback(false, MSG_MISSING_CHANNEL);

        //检查是否已经订阅该频道
        if (!SUB_CHANNEL_LIST.contain(channel)) {
            return __error(MSG_NO_THIS_CHANNEL) && callback(false, MSG_NO_THIS_CHANNEL);
        }
        try {
            this.socket.emit('unsubscribe', { 'topic': channel});
        } catch (err) {
            return __error(MSG_SOCKET_EMIT_ERROR) && callback(false, MSG_SOCKET_EMIT_ERROR);
        }
    };

    Yunba.prototype.publish = function (args, callback) {

        if(this.socket_connected === false){
            return false;
        }

        if (!this.connected) {
            return __error(MSG_NEED_CONNECT) && callback(false, MSG_NEED_CONNECT);
        }

        this.puback_cb = callback;

        var channel = args['topic'] || args['channel'];
        var msg = args['msg'];
        var qos = args['qos'] || QOS1;
        var callback = args['callback'] || callback || function () {
            };

        if (!channel) return __error(MSG_MISSING_CHANNEL) && callback(false, MSG_MISSING_CHANNEL);
        if (!msg)     return __error(MSG_MISSING_MESSAGE) && callback(false, MSG_MISSING_MESSAGE);

        try {
            this.socket.emit('publish', {'topic': channel, 'msg': msg, 'qos': qos });
        } catch (err) {
            return __error(MSG_SOCKET_EMIT_ERROR) && callback(false, MSG_SOCKET_EMIT_ERROR);
        }
    };

    Yunba.prototype.publish2 = function (args, callback) {

        if (this.socket_connected === false) {
            return false;
        }

        if (!this.connected) {
            return __error(MSG_NEED_CONNECT) && callback(false, MSG_NEED_CONNECT);
        }

        this.publish2_ack_cb = callback;

        var topic = args['topic'] || args['channel'];
        var msg = args['msg'];
        var opts = args['opts'] || {
                'qos': QOS1
            };

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
            return __error(MSG_SOCKET_EMIT_ERROR) && callback(false, MSG_SOCKET_EMIT_ERROR);
        }
    };

    Yunba.prototype.publish_to_alias = function (args, callback) {
        this.puback_cb = callback;
        this.socket.emit('publish_to_alias', args);
    };

    Yunba.prototype.publish2_to_alias = function (args, callback) {

        if (this.socket_connected === false) {
            return false;
        }

        if (!this.connected) {
            return __error(MSG_NEED_CONNECT) && callback(false, MSG_NEED_CONNECT);
        }

        this.publish2_ack_cb = callback;

        var alias = args['alias'];
        var msg = args['msg'];
        var opts = args['opts'] || {
                'qos': QOS1
            };

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
            return __error(MSG_SOCKET_EMIT_ERROR) && callback(false, MSG_SOCKET_EMIT_ERROR);
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
