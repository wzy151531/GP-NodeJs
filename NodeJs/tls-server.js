let tls = require('tls');
let fs = require('fs');
let moment = require('moment');
let calculate = require('./calculate');
moment.locale('zh-cn');
// 聚合所有客户端的IP地址和名称和socket
let clientsInfo = [];
let options = {
    key: fs.readFileSync('openssl/server-key.pem'),
    cert: fs.readFileSync('openssl/server-cert.pem'),
    ca: [fs.readFileSync('openssl/ca-cert.pem')],
    // 关闭客户端认证
    requestCert: true,
    rejectUnauthorized: false
};

let server = tls.createServer(options, (socket) => {
    let cnt = 1;
    let collectCnt = 1;
    // 将采集到的三次指纹合并为一个字符串放进collectData中
    let collectData = '';
    // 监听模式标志位
    let askForPwd = 0;
    // 管理端要管理的客户端对象
    let clientManaged = {};
    let clientName = 'UNKNOWN';
    socket.setEncoding('utf8');
    socket.write("Welcome!\n");
    socket.on('data', (data) => {
        let dataString = data.toString();
        // 客户端第一次发送信息给服务器，申明自己的身份
        if (cnt === 1) {
            clientName = dataString;
            let certainClientInfo = {};
            certainClientInfo.socket = socket;
            certainClientInfo.IP = socket.remoteAddress;
            certainClientInfo.Name = clientName;
            clientsInfo.push(certainClientInfo);
            console.log(`Remote connection[${clientName}] connected(${socket.authorized ? 'Authorized' : 'Unauthorized'})`);
            console.log(`Data have been ${socket.encrypted ? 'encrypted' : 'unencrypted'}`);
            // 客户端之后发送的信息由服务器进行处理并返回，且将信息写入log文件
        } else {
            let logString = `Connection[${clientName}] sent:"${dataString}"[${moment().format('YYYY-MM-DD HH:mm:ss')}]`;
            // 若发送消息者为管理端
            if (clientName === 'ADMIN' && socket.authorized) {
                console.log(`Got[${clientName}]: ${dataString}`);
                // 若下一次数据监听为密码监听
                if (askForPwd) {
                    // 密码正确，执行开门操作
                    if (dataString === '123456') {
                        socket.write('PASSWORD CORRECT!Command Allow');
                        console.log('PASSWORD CORRECT!Command Allow');
                        logString = `${logString} Request for access of [${clientManaged.Name}];Request Allow\n`;
                        clientManaged.socket.write('1');
                    } else {
                        socket.write('PASSWORD ERROR!Command Deny');
                        console.log('PASSWORD ERROR!Command Deny');
                        logString = `${logString} Request for access of [${clientManaged.Name}];Request Deny\n`;
                    }
                    // 将下一次数据监听改为普通监听
                    askForPwd = 0;
                    clientManaged = {};
                    //下一次监听为普通监听
                } else {
                    // 将管理端发送来的消息以'|'符号进行分割存入数组，如TEST-CLIENT|OPEN
                    let adminArray = dataString.split('|');
                    // 用于判断管理端发送的命令中管理客户端对象是否存在
                    let clientExist = 0;
                    clientsInfo.forEach((item, index) => {
                        if (adminArray[0] === item.Name) {
                            if (adminArray[1] === 'OPEN') {
                                socket.write('Enter the password for command:');
                                console.log(`Waiting for the password to manage ${item.Name}...`);
                                logString = `${logString};Response for password\n`;
                                // 将下一次数据监听设为密码监听
                                askForPwd = 1;
                                clientManaged = item;
                            } else {
                                logString = `${logString};Request Deny\n`;
                            }
                            // 客户端存在
                            clientExist = 1;
                        }
                    });
                    if (!clientExist) {
                        console.log(`Client[${adminArray[0]}] does not exist`);
                        logString = `${logString};Client does not exist\n`;
                    }
                }
            } else if (clientName === 'TEST-CLIENT') {
                // 将收到的16进制字符串通过空格分离成数组
                let dataArray = data.split(' ');
                // 将有效数据部分提出
                let realDataArray = dataArray.slice(21, -3);
                let realData = realDataArray.join(' ');
                let fileName = './fingerprint_feature/users.txt';
                // 若为识别此指纹特征值
                if (dataArray[0] === 'R') {
                    logString = `${logString};Request Void Temporarily\n`;
                    console.log(`Recognize fingerprint feature[${clientName}]: ${data}`);
                    // 将指纹特征值模板文件中所有模板读入到templetData
                    let templetData = '';
                    // 将读取到的templetData由'\n'分割成各个模板放入数组templetArray中
                    let templetArray = [];
                    fs.readFile(fileName, 'utf8', (err, data) => {
                        if (err) {
                            console.log(err);
                        } else {
                            templetData = data;
                            templetArray = templetData.split('\n');
                            templetArray = templetArray.slice(0, -1);
                            console.log(`TempletData of fingerprint feature have been read(${templetArray.length} data)`);
                            for (let i = 0; i < templetArray.length; i++) {
                                console.log(`templetArray[${i}]=${templetArray[i]}`);
                            }
                            calculate.matchingFeature(templetArray, realData);
                        }
                    });
                    // 若为采集此指纹特征值
                } else if (dataArray[0] === 'C') {
                    logString = `${logString};Request Allow\n`;
                    console.log(`Collect fingerprint feature[${clientName}]: ${data}`);
                    let appendFileCnt = collectCnt % 3;
                    if (appendFileCnt === 1) {
                        collectData = realData;
                    } else if (appendFileCnt === 2) {
                        collectData = `${collectData} ${realData}`;
                    } else if (appendFileCnt === 0) {
                        collectData = `${collectData} ${realData}\n`;
                        // 当三次指纹采集完成后才将数据写进文件
                        fs.appendFile(fileName, collectData, (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(`Fingerprint feature have been wrote in ${fileName}`);
                                collectData = '';
                            }
                        });
                    }
                    collectCnt++;
                }
            } else {
                logString = `${logString};Request Deny\n`;
                console.log(`Unknown data[${clientName}]: ${data}`);
                socket.write('UNKNOWN CLIENT,REQUEST DENY!');
            }

            // 将logString写入log文件
            fs.appendFile('log.txt', logString, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Data have been wrote in ./log.txt');
                }
            })
        }
        cnt++;
    });
    // 所有端端保持连接
    socket.setKeepAlive(true);
    // 一旦客户端断开连接便发出警告
    socket.on('close', () => {
        clientsInfo.forEach((item, index) => {
            if (item.socket === socket) {
                console.log(`Clients ${item.Name} has been removed`);
                clientsInfo.splice(index, 1);
            }
        });
        console.log(`WARNING:Connection[${clientName}] has closed,LOSING CONTROL...`);
    });
    // 客户端强制关闭时接住error不会导致服务器崩溃
    socket.on('error', (err) => {
        console.log(`Connection[${clientName}] error: ${err.message}`);
    })
});

server.on('error', (err) => {
    console.log(`Server error: ${err.message}`);
});

server.on('close', () => {
    console.log('Server closed');
})
;

server.listen(8080, () => {
    console.log('Server bound');
});