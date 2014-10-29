#!/usr/local/bin/node

/* 简单测试 NodeJS 下的连接功能 */

var Yunba = require('./yunba');
var yunba = new Yunba({
    server: 'sock.yunba.io',
    port: 3000,
    appkey: '52fcc04c4dc903d66d6f8f92'
});
yunba.init(function (success) {
  if (success) {
    console.log('初始化成功，已连接上 socket。');
    console.log('SocketId: ' + yunba.socket.socket.sessionid);
    yunba.connect(function (success, msg) {
      if (success) {
        console.log('连接成功 !');
      } else {
        alert(msg);
      }
    });
  }
});
