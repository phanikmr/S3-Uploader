# S3-Uploader

S3-Uploader is a javascript library for uploading files from a browser to AWS S3, using parallel S3's multipart & non multipart uploads with MD5 checksum support and control over pausing / resuming the upload.

Adapted from +[Fine uploader] (https://github.com/FineUploader/fine-uploader)
 +[EvaporateJS] (https://github.com/TTLabs/EvaporateJS)

This Javascript library Tweaked by adapting best features of Fine Uploader & EvaporateJS for max uploading speed to AWS S3 bucket

# Installation

S3-Uploader is publiashed as a Node module

```bash
$ npm install uploader-s3
```
Otherwise, include it in your HTML:

```html
<script language="javascript" type="text/javascript" src="../dist/s3uploader.min.js"></script>
```

## Example
```javascript

var MultipartUploaderRef;
var BasicUploaderRef;
var s3Details = {};
var Promise = window.Promise;
var PART_SIZE = 6 * 1024 * 1024;

s3Details.s3bucket = null;
s3Details.signatureURL = null;
s3Details.awsRegion = null;
s3Details.accessKey = null;
uploadingFilesList$ = null;



function initialiseUploader(region, access_key, bucket, signer_url, time_url, sign_params) {
    s3Details.s3bucket = bucket;
    s3Details.signatureURL = signer_url;
    s3Details.awsRegion = region;
    s3Details.accessKey = access_key;

    MultipartUploaderRef = Uploader.s3.UploaderMultipart.create({
        signerUrl: signer_url,
        timeUrl: time_url,
        aws_key: access_key,
        bucket: bucket,
        aws_url: 'https://s3-' + region + '.amazonaws.com',
        awsRegion: region,
        signParams: sign_params
    });
    BasicUploaderRef = new Uploader.s3.UploaderBasic({
        request: {
            endpoint: 'https://' + bucket + '.s3.amazonaws.com',
            accessKey: access_key
        },
        objectProperties: {
            bucket: bucket,
            host: 'https://' + bucket + '.s3.amazonaws.com',
            key: function(id) {
                var file = uploadingFilesList$[id];
                return file.path + '/' + file.awsKey;
            },
            region: awsRegion,
            serverSideEncryption: true
        },
        signature: {
            endpoint: signer_url,
            version: 4
        },
        resume: {
            enabled: true
        },
        autoUpload: true,
        maxConnections: 100,
        chunking: {
            enabled: false
        },
        retry: {
            enableAuto: true
        },
        cors: {
            expected: false,
            sendCredentials: true,
        },
        callbacks: {
            onProgress: function(id, name, totalUploaded, totalBytes) {
                var file = uploadingFilesList$[id];
                file.percentage = parseInt((((totalUploaded / totalBytes) * 100)).toString(), 10);
                file.progress.loaded = totalUploaded ? ((totalUploaded / 1048576) > 1 ?
                        (totalUploaded / 1048576).toFixed(2).toString() + 'MB' :
                        (totalUploaded / 1024).toFixed(2).toString() + 'KB') : '0KB',
                    $("#" + file.awsGuid + "Progress").attr("style", "width:" + file.percentage + "%");
                $("#" + file.awsGuid + "Stats").text(file.progress.loaded + " of " + file.readableSize);
            },
            onComplete: function(id, name, success) {
                if (success) {
                    var file = uploadingFilesList$[id];
                    file._promise.resolve(file);
                }
            },
            onError: function(id, name, errorReason) {
                var file = uploadingFilesList$[id];
                file._promise.reject(file);
            }
        }
    });
    uploadingFilesList$ = new Array();
}


function cancelUploadNonMultipart(file) {
    BasicUploaderRef.cancel(file.id);
}


function uploadFile(file, path) {
    if (file.size > PART_SIZE) {
        return new Promise(
            function(resolve, reject) {

                MultipartUploaderRef.then(function(uploader) {

                    file.cancelUpload = function() {
                        uploader.cancel(s3Details.s3bucket + '/' + path + '/' + file.awsGuid + file.filetype);
                    };

                    var addConfig = {
                        name: file.awsGuid + file.filetype,
                        file: file,
                        xAmzHeadersAtInitiate: {
                            'x-amz-server-side-encryption': 'AES256'
                        },
                        progress: function(progressValue, data) {
                            file.percentage = parseInt(((progressValue * 100)).toString(), 10);
                            $("#" + file.awsGuid + "Progress").attr("style", "width:" + file.percentage + "%");
                            //$("#" + file.awsGuid + "Progress").text(file.percentage+"%");
                            if (data) {
                                file.progress = {
                                    loaded: data.totalUploaded ? ((data.totalUploaded / 1048576) > 1 ?
                                        (data.totalUploaded / 1048576).toFixed(2).toString() + 'MB' :
                                        (data.totalUploaded / 1024).toFixed(2).toString() + 'KB') : '0KB',
                                    speed: data.speed ? data.readableSpeed + 'ps' : '0Kbps',
                                    timeLeft: data && (data.secondsLeft >= 0) ?
                                        (data.secondsLeft > 60 ? Math.round(data.secondsLeft / 60).toString() + 'min' :
                                            Math.round(data.secondsLeft).toString() + 'sec') : '?sec'
                                };
                                $("#" + file.awsGuid + "Stats").text(file.progress.loaded + " of " + file.readableSize);
                            }
                        }
                    };
                    var overrides = {
                        bucket: s3Details.s3bucket + '/' + path
                    };


                    uploader.add(addConfig, overrides)
                        .then(function(awsObjectKey) {
                                resolve(file);
                            },
                            function(reason) {
                                file.reason = reason;
                                reject(file);
                            });
                });
            });
    } else {
        return new Promise(
            function(resolve, reject) {
                file._promise = { resolve: resolve, reject: reject };
                file.path = path + '/' + file.awsGuid + file.filetype;
                file.cancelUpload = function() {
                    cancelUploadNonMultipart(file);
                };
                file.id = uploadingFilesList$.length;
                uploadingFilesList$.push(file);
                BasicUploaderRef.addFiles(file);
            });
    }
}
```
