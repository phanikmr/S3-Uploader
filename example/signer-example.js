/**
 * NodeJs Server-Side Example for Uploader S3.
 * Maintained by PhaniKumar.
 *
 * This example:
 *  - signs policy documents (simple uploads) and REST requests
 *    (non multipart/multipart uploads)
 *  - supports version 4 signatures
 *
 * Requirements:
 *  - express 3.3.5+ (for handling requests)
 *  - node-forge (for signing requests)
 */

var express = require("express"),
    forge = require('node-forge'),
    app = express(),
    bodyParser = require('body-parser');

var signingKeys = {};

const AWS_CONST = {
    SecretKey: '',
    AccessKey: '',
    Region: 'us-west-1',
    Service: 's3',
    Version: 'AWS4',
    RequestType: 'aws4_request',
    Bucket: '',
};

app.get('/awsSignature', (req, res) => {
    var signingKey;
    if (signingKeys[dateString()] === undefined) {
        const dateKey = hmac(AWS_CONST.Version + AWS_CONST.SecretKey, dateString());
        const dateRegionKey = hmac(dateKey, AWS_CONST.Region);
        const dateRegionServiceKey = hmac(dateRegionKey, AWS_CONST.Service);
        signingKey = signingKeys[signatureHelper.dateString()] = hmac(dateRegionServiceKey, AWS_CONST.RequestType);
    } else {
        signingKey = signingKeys[signatureHelper.dateString()];
    }
    try {
        var signedPolicy = hmac(signingKey, req.query.to_sign).toHex();
        res.send(signedPolicy);
    } catch (error) {
        res.status(400).send({ error: error });
    }
});

app.post('/awsSignature', (req, res) => {
    var policy = req.body;

    const base64Policy = new Buffer(JSON.stringify(policy)).toString('base64');
    var AWS_CONST = global.CurrentEnvironment.AWS_CONST;
    var signingKeys = global.CurrentEnvironment.AWSSigningKey;
    var signingKey;
    if (signingKeys[dateString()] === undefined) {
        const dateKey = hmac(AWS_CONST.Version + AWS_CONST.SecretKey, dateString());
        const dateRegionKey = hmac(dateKey, AWS_CONST.Region);
        const dateRegionServiceKey = hmac(dateRegionKey, AWS_CONST.Service);
        signingKey = signingKeys[dateString()] = hmac(dateRegionServiceKey, AWS_CONST.RequestType);
    } else {
        signingKey = signingKeys[dateString()];
    }
    try {
        var signedPolicy = {
            policy: base64Policy,
            signature: signatureHelper.hmac(signingKey, base64Policy).toHex()
        }
        res.send(signedPolicy);
    } catch (error) {
        res.status(400).send({ error: error });
    }
});


var hmac = (key, msg) => {
    var hmacForge = forge.hmac.create();
    hmacForge.start('sha256', key);
    hmacForge.update(msg);
    return hmacForge.getMac();
}

var dateString = () => {
    var date = new Date().toISOString();
    return date.substr(0, 4) + date.substr(5, 2) + date.substr(8, 2);
}