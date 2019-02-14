var tls = require('tls');
var fs = require('fs');
var options = {
    host: '192.168.1.13',
    port: 8080,
    // key: fs.readFileSync('client-key.pem'),
    // cert: fs.readFileSync('client-cert.pem'),
    ca: [ fs.readFileSync('server-cert.pem') ],
    rejectUnauthorized: false
};
var client = tls.connect(options, function() {
    console.log('Client connected', client.authorized ? 'authorized' : 'unauthorized');
    process.stdin.setEncoding('utf8');
    process.stdin.resume();
    process.stdin.on('readable', function() {
        var chunk = process.stdin.read();
        if(typeof chunk === 'string'){
            chunk = chunk.slice(0,-2);
            client.write(chunk);
        }
        if(chunk === ''){
            process.stdin.emit('end');
            return
        }
        if (chunk !== null) {
            process.stdout.write(`Sent data: ${chunk}\n`);
        }
    });
    process.stdin.on('end', () => {
        process.stdout.write('end');
    });
});
client.setEncoding('utf8');
client.on('data', function(data) {
    console.log('Got Data:', data);
});