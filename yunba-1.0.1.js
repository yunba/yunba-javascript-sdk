var Yunba;
var DEF_SERVER = 'sock.yunba.io';
var DEF_PORT = 3000;
var QOS0 = 0;
var QOS1 = 1;
var QOS2 = 2;
var SUB_CHANNEL_LIST = [];//已经订阅的频道或频道列表
var MSG_MISSING_MESSAGE = 'Missing Message';
var MSG_MISSING_CHANNEL = 'Missing Channel';
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

var __bind = function (fn, me) {
    return function () {
        return fn.apply(me, arguments);
    };
};

var __error = function (msg) {
    console.log(msg);
    return true;
}

var noop = function(){}

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
        rec_callback=rec_callback||function(){};
        me.receive_msg_cb_list={};
        try {
            console.log('js client start init...');
            me.socket = io.connect('http://' + this.server + ':' + this.port);
            me.socket.on('connect', function () {
                console.log('js client init success.');
                me.socket_connected = true;
                init_callback(true);
            });

            me.socket.on('error',function(e){
                console.log('js client init error:',e);
                me.socket_connected=false;
                init_callback(false);
            });

            me.socket.on('disconnect', function () {
                console.log('js client disconnect.');
                me.socket_connected = false;
                init_callback(false);
            });
            me.socket.on('reconnect', function () {
                console.log('js client reconnect.');
                if (rec_callback) {
                    rec_callback();
                }
            });
            me.socket.on('reconnect_failed', function () {
                console.log('js client reconnect failed.');
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

            me.socket.on('suback', function (data) {
                if (data.success) {
                    //如果订阅成功，则监听来自服务端的message消息
                    if (me.suback_cb)
                        me.suback_cb(true);
                    if (me.socket.listeners('message').length === 0) {
                        me.socket.on('message', function (data) {
                            if(me.receive_msg_cb_list[data.topic])
                                me.receive_msg_cb_list[data.topic](data);
//                            if (me.receive_msg_cb)
//                                me.receive_msg_cb(data);
                        });
                    }
                } else {
                    if (me.suback_cb)
                        me.suback_cb(false, MSG_SUB_FAIL)
                    return __error(MSG_SUB_FAIL);
                }
            });

            me.socket.on('unsuback', function (result) {
                console.log(result);
                if (result.success) {
                    SUB_CHANNEL_LIST.remove(channel);
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
                    me.connected = true
                    if (me.connack_cb)
                        me.connack_cb(true);
                } else {
                    if (me.connack_cb)
                        me.connack_cb(false, result.msg);
                }
            });

            me.socket.on('set_alias_ack',function(result){
                if(result.success){
                    if(me.set_alias_cb){
                        me.set_alias_cb();
                    }
                }
            });

            me.socket.on('alias',function(result){
                me.get_alias_cb(result);
            });

            me.socket.on('here_now_ack',function(result){
                me.here_now_cb(result);
            });

            me.socket.on('where_now_ack',function(result){
                me.where_now_cb(result);
            });

        } catch (err) {
            return __error(MSG_CONNECT_FAIL) && init_callback(false, MSG_CONNECT_FAIL);
        }
    };

    Yunba.prototype.connect = function (callback) {
        if(this.socket_connected === false){
            return false;
        }
        this.connack_cb = callback;
        try {
            this.socket.emit('connect', {appkey: this.appkey});
        } catch (err) {
            return __error(MSG_SOCKET_EMIT_ERROR) && callback(false, MSG_SOCKET_EMIT_ERROR);
        }
    };

    Yunba.prototype.disconnect = function (callback) {
        var self = this;
        if (!self.connected) {
            return callback(true);
        }
        try {
            this.socket.emit('disconn', {});
            self.connected = false;
            callback(true);
        } catch (err) {
            return __error(MSG_SOCKET_EMIT_ERROR) && callback(false, MSG_SOCKET_EMIT_ERROR);
        }
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

        this.receive_msg_cb_list[channel] = cb2 || function () {};

        //检查是否已经订阅该频道
        if (SUB_CHANNEL_LIST.contain(channel)) {
            return __error(MSG_SUB_REPEAT_ERROR) && this.suback_cb(false, MSG_SUB_REPEAT_ERROR);
        }
        SUB_CHANNEL_LIST.push(channel);

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

        var channel = args['topic'];
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

    Yunba.prototype.setAlias = function (alias,callback) {
        var me = this;



        if(me.socket_connected === false){
            return false;
        }

        if (!me.connected) {
            return __error(MSG_NEED_CONNECT) && callback(false, MSG_NEED_CONNECT);
        }

        var cb = callback || noop;

        console.log('[JS SDK]setAlias...');
        me.set_alias_cb = cb;
        me.socket.emit('set_alias',{alias:alias});
    };

    Yunba.prototype.getAlias = function (callback) {
        var me = this;

        if(me.socket_connected === false){
            return false;
        }

        if (!me.connected) {
            return __error(MSG_NEED_CONNECT) && callback(false, MSG_NEED_CONNECT);
        }

        cb = callback || noop;
        me.get_alias_cb=cb;
        me.socket.emit('get_alias',{});
    };

    Yunba.prototype.hereNow = function (topic,cb) {
        var me = this;

        if(me.socket_connected === false){
            return false;
        }
        if (!me.connected) {
            return __error(MSG_NEED_CONNECT) && callback(false, MSG_NEED_CONNECT);
        }

        cb = cb || noop;
        me.here_now_cb = cb;
        me.socket.emit('here_now',{topic:topic});
    };

    Yunba.prototype.whereNow = function (alias,cb) {
        var me = this;

        if(me.socket_connected === false){
            return false;
        }
        if (!me.connected) {
            return __error(MSG_NEED_CONNECT) && callback(false, MSG_NEED_CONNECT);
        }

        cb = cb || noop;
        me.where_now_cb = cb;
        me.socket.emit('where_now',{alias:alias});
    };

    return Yunba;

})();
