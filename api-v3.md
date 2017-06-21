[![Build Status](https://travis-ci.org/yunba/yunba-javascript-sdk.png?branch=3.0-beta)](http://travis-ci.org/yunba/yunba-javascript-sdk)
[![Coverage Status](https://coveralls.io/repos/yunba/yunba-javascript-sdk/badge.svg?branch=3.0-beta&service=github)](https://coveralls.io/github/yunba/yunba-javascript-sdk?branch=3.0-beta)

## Quick Start

```js
// 默认自动连接
var client = new Yunba({
    url: 'http://sock.yunba.io:3000',
    customId: 'test_user_id_2016',
    appkey: '54d0c24252be1f7e1dd84c42',
    logLevel: 'debug',
    // 默认消息处理函数
    // 如果 subscribe 等没有传入消息处理函数, 会默认使用这个函数
    messageHandler: function(data) { },

    // mqtt 连接错误的时候被调用, 如 appkey 被限制
    mqttConnectErrorHandler: function(err) {
      console.log(arguments);
    },
  
    // socketio 连接错误的时候被调用, 如地址或无网络
    socketioConnectErrorHandler: function(err) {
      console.log(arguments);
    }

});

// 实例化后可直接调用, 无须等待
client.subscribe({
    topic: 'topic',
    // 这个频道的消息将由这个函数处理, 而不是上面的全局函数
    messageHandler: function(data) {}
}, function(err, result) {
    console.log(arguments);
});

client.publish({
    msg: 'this a testing message',
    topic: 'topic',
    messageId: '14629351650436345636',
    qos: 1
}, function(err, result) {
    console.log(arguments);
});
```


## API

- [new Yunba(Object options)](#new-yunbaobject-options)  
  - [.connectSocketio(Function callback)](#connectsocketiofunction-callback)
  - [.connectMqtt(Function callback)](#connectmqttfunction-callback)
  - [.subscribe(Object options [, Function callback ])](#subscribeobject-options--function-callback-)  
  - [.unsubscribe(Object options [, Function callback ])](#subscribepresenceobject-options--function-callback-)  
  - [.subscribePresence(Object options [, Function callback ])](#unsubscribeobject-options--function-callback-)  
  - [.unsubscribePresence(Object options [, Function callback ])](#unsubscribepresenceobject-options--function-callback-) 
  - [.publish(Object options [, Function callback ])](#publishobject-options--function-callback-)  
  - [.publish2(Object options [, Function callback ])](#publish2object-options--function-callback-)  
  - [.publishToAlias(Object options [, Function callback ])](#publishtoaliasobject-options--function-callback-)  
  - [.publish2ToAlias(Object options [, Function callback ])](#publish2toaliasobject-options--function-callback-)  
  - [.getAlias(Function callback)](#getaliasfunction-callback)  
  - [.setAlias(String alias [, Function callback ])](#setaliasstring-alias--function-callback-)  
  - [.getState(String alias Function callback)](#getstatestring-alias-function-callback)  
  - [.getTopicList(String alias, Function callback)](#gettopicliststring-alias-function-callback)  
  - [.getAliasList(String topic, Function callback)](#getaliasliststring-topic-function-callback)  

### new Yunba(Object options)  

```js
var client = new Yunba(options);
```
| 参数 | 类型 | 必须 | 默认 | 描述 | 例子 |  
|---|---|---|---|---|---|
| options | Object | 是 |  |  |  |
| options.url | String | 否 |  | 云巴服务地址 | http://sock.yunba.io:3000 |  
| options.appkey | String | 是 |  | 云巴应用 appkey |  |  
| options.customId | String | 否 |  | 自定义连接 id |  |  
| options.messageHandler | Function | 否 |  |  全局消息处理函数 |  |  
| options.socketioConnectErrorHandler | Function | 否 |  | 当 socketio 层断开的时候执行的函数 |  |  
| options.mqttConnectErrorHandler | Function | 否 |  | mqtt 层连接错误时执行 |  |
| options.autoConnect | Boolean | 否 |  |是否当执行任意操作的时候自动连接,而不需要显式手动调用连接函数 |  |  
| options.logLevel | String | 否 | debug | infor | warning | error | | debug |


### .connectSocketio(Function callback)

```js
// 如果构造函数传入 `autoConnect`, 则用户无须手动调用此函数
client.connectSocketio(function(err, result) {
    if (!err) {
      // ...
    } else {
      // ...
    }
});

```

### .connectMqtt(Function callback)
```js
// 如果构造函数传入 `autoConnect`, 则用户无须手动调用此函数
// 另外, 后面所有接口的调用无须放在下回调里面, 代码自动会等待连接成功后再调用
client.connectMqtt(function(err, result) {
    if (!err) {
      // ...
    } else {
      // ...
    }
});

```

### .subscribe(Object options [, Function callback ])
```js
var options = {
    topic: 'tp1'
};
client.subscribe(options, function(err) {
    if (!err) {
        // ...
    } else {
        // error
    }
});
```
| 参数 | 类型 | 必须 | 默认 | 描述 | 例子 |  
|---|---|---|---|---|---|
| options | Object | 是 |  |  |  |
| options.topic | String | 是 |  | 订阅的频道 |  |
| options.qos | Number | 否 |  | 服务质量 0, 1, 2, 默认 1| 1 | 
| options.messageId | Number | 否 |  |  messageId, 请保证唯一, 否则消息处理函数将搞乱; 如果不传入, 将自动生成 |  | 
| options.messageHandler |  Function | 否 |  | 处理该频道的消息的函数, 如果不传入, 将使用在构造函数传入的处理函数 |  | 
| callback | Function | 否 |  | 回调函数 |  |


### .subscribePresence(Object options [, Function callback ])
```js
var options = {
    topic: 'tp1'
};
client.subscribePresence(options, function(err) {
    if (!err) {
        // ...
    } else {
        // error
    }
});
```
| 参数 | 类型 | 必须 | 默认 | 描述 | 例子 |  
|---|---|---|---|---|---|
| options | Object | 是 |  |  |  |
| options.topic | String | 是 |  | 频道 |  |
| options.qos | Number | 否 |  | 服务质量 0, 1, 2, 默认 1| 1 | 
| options.messageId | Number | 否 |  |  messageId, 请保证唯一, 否则消息处理函数将搞乱; 如果不传入, 将自动生成 |  | 
| options.messageHandler |  Function | 否 |  | 处理该频道的消息的函数, 如果不传入, 将使用在构造函数传入的处理函数 |  | 
| callback | Function | 否 |  | 回调函数 |  |


### .unsubscribe(Object options [, Function callback ])  

```js
var options = {
    topic: 'tp1'
}
client.subscribe(options, function(err) {
    if (!err) {
        // ...
    } else {
        // error
    }
});

```
| 参数 | 类型 | 必须 | 默认 | 描述 | 例子 |  
|---|---|---|---|---|---|
| options | Object | 是 |  |  |  |  
| options.topic | String | 是 |  | 订阅的频道 |  |
| options.messageId | Number | 否 |  | messageId, 请保证唯一, 否则消息处理函数将搞乱; 如果不传入, 将自动生成 |  | 
| callback | Function | 否 |  | 回调函数 |  |


### .unsubscribePresence(Object options [, Function callback ])  

```js
var options = {
    topic: 'tp1'
}
client.unsubscribePresence(options, function(err) {
    if (!err) {
        // ...
    } else {
        // error
    }
});

```
| 参数 | 类型 | 必须 | 默认 | 描述 | 例子 |  
|---|---|---|---|---|---|
| options | Object | 是 |  |  |  |  
| options.topic | String | 是 |  | 订阅的频道 |  |
| options.messageId | Number | 否 |  | messageId, 请保证唯一, 否则消息处理函数将搞乱; 如果不传入, 将自动生成 |  | 
| callback | Function | 否 |  | 回调函数 |  |


### .publish(Object options [, Function callback ])

```js
var options = {
  'topic': 'my_topic', 
  'msg': 'test_message',
  'messageId': 199900724, 
  'qos': 1
};
client.publish(options, cb);

```
| 参数 | 类型 | 必须 | 默认 | 描述 | 例子 |  
|---|---|---|---|---|---|
| options | Object | 是 |  |  |  |  
| options.topic | String | 否 |  | 发送到频道时必填 |  |
| options.qos | Number | 否 | 1 | 服务质量 0, 1, 2| 1 | 
| options.msg | String | 是 |  |  要发的消息 |  |
| options.messageId | Number | 否 |  | messageId, 请保证唯一, 否则消息处理函数将搞乱; 如果不传入, 将自动生成 |  | 
| callback | Function | 否 |  | 回调函数 |  |



### .publish2(Object options [, Function callback ])

```js
var options = {
    'topic': 'myTopic',
    'msg': 'publish2message',
    'opts': {
        'qos': 1,
        'time_to_live': 36000,
        'apn_json': {
            'aps': {'sound': 'bingbong.aiff', 'badge': 3, 'alert': 'yunba'}
        },
        'messageId': '11833652203486491113'
    }
};
client.publish2(options, cb);

```
| 参数 | 类型 | 必须 | 默认 | 描述 | 例子 |  
|---|---|---|---|---|---|
| options | Object | 是 |  |  |  |  
| options.topic | String | 否 |  | 发送到频道时必填 |  |
| options.msg | String | 是 |  |  要发的消息 |  |
| options.opts | Object | 否 |  |  |  |  
| options.opts.qos | String | 否 |  |  |  |  
| options.opts.apn_json | Object | 否 |  | 如果不填，则不会发送 APN |  |  |
| options.opts.time_to_live | Number | 否 |  | 用来设置 离线消息 保留多久。单位为秒（例如，3600 代表 1 小时），默认值为 5 天，最大不超过 15 天。 |  |
| options.opts.messageId | String | 否 |  |  |  |
| callback | Function | 否 |  | 回调函数 |  |


### .publishToAlias(Object options [, Function callback ])

```js
var options = {
  'alias': 'myAlias', 
  'msg': 'test_message',
  'messageId': 199900725, 
  'qos': 1
};
client.publishToAlias(options, cb);

```
| 参数 | 类型 | 必须 | 默认 | 描述 | 例子 |  
|---|---|---|---|---|---|
| options | Object | 是 |  |  |  |  
| options.alias | String | 否 |  | 发送到别名时必填 |  |
| options.qos | Number | 否 |  | 服务质量 0, 1, 2, 默认 1| 1 | 
| options.msg | String | 是 |  |  要发的消息 |  |
| options.messageId | Number | 否 |  | messageId, 请保证唯一, 否则消息处理函数将搞乱; 如果不传入, 将自动生成 |  |
| callback | Function | 否 |  | 回调函数 |  |



### .publish2ToAlias(Object options [, Function callback ])

```js
var options = {
    'topic': 'myAlias',
    'msg': 'publish2message',
    'opts': {
        'qos': 1,
        'time_to_live': 36000,
        'apn_json': {
            'aps': {'sound': 'bingbong.aiff', 'badge': 3, 'alert': 'yunba'}
        },
        'messageId': '11833652203486491113'
    }
};
client.publish2ToAlias(options, cb);

```
| 参数 | 类型 | 必须 | 默认 | 描述 | 例子 |  
|---|---|---|---|---|---|
| options | Object | 是 |  |  |  |  
| options.alias | String | 否 |  | 发送到别名时必填 |  |
| options.msg | String | 是 |  |  要发的消息 |  |
| options.opts | Object | 否 |  |  |  |  
| options.opts.qos | String | 否 |  |  |  |  
| options.opts.apn_json | Object | 否 |  | 如果不填，则不会发送 APN |  |  |
| options.opts.time_to_live | Number | 否 |  | 用来设置 离线消息 保留多久。单位为秒（例如，3600 代表 1 小时），默认值为 5 天，最大不超过 15 天。 |  |
| options.opts.messageId | String | 否 |  |  |  |
| callback | Function | 否 |  | 回调函数 |  |


### .getAlias(Function callback)  
```js
client.getAlias(function(err, result) {
  if (!err) {
    console.log(result.alias);
  }
});

```
| 参数 | 类型 | 必须 | 默认 | 描述 | 例子 |  
|---|---|---|---|---|---|
| callback | Function | 否 |  | 回调函数 |  |


### .setAlias(String alias [, Function callback ])
```js
client.setAlias('Lucy', cb);
```
| 参数 | 类型 | 必须 | 默认 | 描述 | 例子 |  
|---|---|---|---|---|---|
| alias | String | 是 |  | 设置的别名 |  |
| callback | Function | 否 |  | 回调函数 |  |

### .getState(String alias, Function callback)
```js
client.getState('Lucy', function(err, result) {
    if(!err) {
      // result
      // { data: 'online' }
      console.log(result.data);
    }
});
```
| 参数 | 类型 | 必须 | 默认 | 描述 | 例子 |  
|---|---|---|---|---|---|
| alias | String | 是 |  | 要查询状态别名 |  |
| callback | Function | 否 |  | 回调函数 |  |


### .getTopicList(String alias, Function callback)  
```js
client.getTopicList('Lucy', function(err, result) {
    if(!err) {
      // result
      // { 
      //   data: { 
      //     topics: [ 'topic21856809608177308',
      //         'topic9321080115658298',
      //         'topic6369260281016675',
      //         'topic14665072415902114',
      //         'topic15091980587620601',
      //         'topic6922469581224377'
      //         ]
      //     } 
      // }
      console.log(result.data.topics);
    }
});

```
| 参数 | 类型 | 必须 | 默认 | 描述 | 例子 |  
|---|---|---|---|---|---|
| alias | String | 是 |  | 要查询状态别名 |  |
| callback | Function | 否 |  | 回调函数 |  |


### .getAliasList(String topic, Function callback)
```js
client.getAliasList('myTopic', function(err, result) {
    if(!err) {
      // reuslt
      // { 
      //    data: { 
      //      alias: [ 
      //          'alias11673352614388643'
      //        ]
      //    }
      //  }
      console.log(result.data.alias);
    }
});

```
| 参数 | 类型 | 必须 | 默认 | 描述 | 例子 |  
|---|---|---|---|---|---|
| topic | String | 是 |  | 要查询的频道 |  |
| callback | Function | 否 |  | 回调函数 |  |


