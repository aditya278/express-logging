const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');
const forceSSL = require('express-force-ssl');

const port = process.env.PORT || 3000;

const certificates = {
    key : fs.readFileSync('./certs/private.key'),
    cert : fs.readFileSync('./certs/certificate.crt')
}

const logPath = __dirname + '/logs';

const httpsServer = https.createServer(certificates, app);
httpsServer.listen(3001, () => {
    console.log(`App Started at https://localhost:3001`);
})

app.use(forceSSL);

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

app.listen(port, () => {
    console.log(`App Started at http://localhost:${port}`);
});