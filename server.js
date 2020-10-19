const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');
const http = require('http');

const httpPort = process.env.HTTP_PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3001;

const certificates = {
    key : fs.readFileSync('./certs/private.key'),
    cert : fs.readFileSync('./certs/certificate.crt')
}

const httpServer = http.createServer(app);
const httpsServer = https.createServer(certificates, app);

const logPath = __dirname + '/logs';

app.use('*', (req, res, next) => {
    if(req.secure)
        next();
    else
        res.redirect('https://'+ req.hostname + ':' + httpsPort + req.url);
});

app.get('/', logger, (req, res) => {
    res.end("Hello World!");
});

function logger(req, res, next) {
    const logMsg = "Got a request from " + req.ip + ", at " + (new Date()).toLocaleString() + "\n";
    fs.readdir(logPath, (err, files) => {
        if(!err && files.length>0) {
            let latestDate = files[0];
            files.forEach(file => {
                let a = new Date(+latestDate);
                let b = new Date(+file);
                if(a < b) {
                    latestDate = file;
                }
            })

            //Get File Size
            let filePath = logPath + '/' + latestDate;
            const stats = fs.statSync(filePath);
            console.log(stats.size);
            if(stats.size > 2000)
                filePath = logPath + '/' + Date.now();

            fs.appendFile(filePath, logMsg, (err) => {
                if(err)
                    res.status(500).send(err.message);
                else
                    console.log(logMsg);
            })
        }
        else {
            let filePath = logPath + '/' + Date.now();
            fs.appendFile(filePath, logMsg, (err) => {
                if(err)
                    res.status(500).send(err.message);
                else
                    console.log(logMsg);
            })
        }
        next();
    })
}

httpServer.listen(httpPort, () => {
    console.log(`App Started at http://localhost:${httpPort}`);
});
httpsServer.listen(httpsPort, () => {
    console.log(`App Started at https://localhost:${httpsPort}`);
})