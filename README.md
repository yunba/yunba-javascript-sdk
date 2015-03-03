# Yunba JavaScript SDK over Socket.IO

文档 http://yunba.io/docs/#yunba-javascript-sdk-使用文档

# 依赖
[jquery-1.10.2.min.js](examples/javascripts/jquery-1.10.2.min.js)

[jquery.query-object.js](examples/javascripts/jquery.query-object.js)

[socket.io.js](examples/javascripts/socket.io.js)

# 试用例子

examples/yunba_javascript_demo.html 演示了如何使用 Yunba JavaScript SDK。试用前先确保 Appkey 正确：

```javascript
	var yunba = new Yunba({server:'sock.yunba.io', port:3000, appkey:'52fcc04c4dc903d66d6f8f92'});
```

** 替换为您的 Appkey **

然后用浏览器打开即可。
