[![Build Status](https://travis-ci.org/yunba/yunba-javascript-sdk.png?branch=master)](http://travis-ci.org/yunba/yunba-javascript-sdk)
[![Coverage Status](https://coveralls.io/repos/yunba/yunba-javascript-sdk/badge.svg?branch=master&service=github)](https://coveralls.io/github/yunba/yunba-javascript-sdk?branch=master)

# Yunba JavaScript SDK over Socket.IO

文档 
[http://yunba.io/docs2/Javascript_SDK/](http://yunba.io/docs2/Javascript_SDK/)

# 依赖
[socket.io-1.3.5.min.js](examples/javascripts/socket.io-1.3.5.min.js)

# 说明

**推荐使用 connect_by_customid() ：**

为了保存 **离线消息、已订阅的频道和别名** 等信息，我们推荐使用  connect_by_customid() 进行连接，connect_by_customid() 使用特定的会话 ID 进行连接，连接后的会话状态会与上次连接保持一致。

[connect_by_customid 官网文档链接](http://yunba.io/docs2/Javascript_SDK/#connect_by_customid)


**使用 connect() 连接：**

在浏览器支持并开启 cookie 的情况下，会自动生成一个 uid 作为 customid 并保存到 cookie 中然后进行 connect_by_customid 连接，若不支持或没开启 cookie 则只会进行普通的 connect 连接。

**普通 connect() 连接兼容旧版本接口，并无法保存会话状态。**

[connect 官网文档链接](http://yunba.io/docs2/Javascript_SDK/#connect)

**connect() 中的 uid 构成方法：**

uid_ + 当前时间的时间戳 + 10000以内随机数

**publish 相关操作时 messageId 构成方法：**

publish、publish2、publish_to_alias、publish2_to_alias 操作时若不指定 messageId 时则会自动生成 messageId。

messageId 是一个64位数字转化成的字符串

高41位当前时间的时间戳 ＋ 低23位随机数

## 浏览器支持
<table>
  <tbody>
    <tr>
      <td>IE</td>
      <td>Safari</td>
      <td>Chrome</td>
      <td>Opera</td>
      <td>Firefox</td>
    </tr>
    <tr>
      <td align="center">7+</td>
      <td align="center">✓</td>
      <td align="center">✓</td>
      <td align="center">✓</td>
      <td align="center">✓</td>
    </tr>
  </tbody>
</table>

**IE 7以下版本支持**

IE7 以下版本会报错对象不支持 "stringify" 属性或方法，在导入 socket.io.js 前导入 json2.js 即可解决。

[https://github.com/douglascrockford/JSON-js](https://github.com/douglascrockford/JSON-js)

```javascript
<!--[if lte IE 7]>
<script  type='text/javascript' src='/javascripts/json2.js'></script>
<![endif]-->
```

## 试用例子

examples/yunba_javascript_demo_customid.html 演示了如何使用 Yunba JavaScript SDK。试用前先确保 Appkey 正确：

```javascript
	var yunba = new Yunba({appkey:'52fcc04c4dc903d66d6f8f92'});
```

** 替换为您的 Appkey **

然后用浏览器打开即可。

## Test  
```
npm install
npm run test
```

