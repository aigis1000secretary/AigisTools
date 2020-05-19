const AnyProxy = require('anyproxy');
const options = {
    port: 8000,
    rule: require('./rule.js'),
    webInterface: { enable: true, webPort: 7999 },
    // throttle: 10000,
    // wsIntercept: false, // 不开启websocket代理
    // forceProxyHttps: false,
    // silent: false,
    // dangerouslyIgnoreUnauthorized: true
};
const proxyServer = new AnyProxy.ProxyServer(options);

proxyServer.on('ready', () => { console.log("AnyProxy ready"); });
// proxyServer.on('error', (e) => { /* */ });
proxyServer.start();

// when finished
// proxyServer.close();

// silent mdoe
require("./node_modules/anyproxy/lib/log.js").setPrintStatus(false);