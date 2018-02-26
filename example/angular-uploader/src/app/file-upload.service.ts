import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { API } from './constants';
// import * as Uploader from 'uploader-s3';

declare var Uploader: any;
const PART_SIZE = 6 * 1024 * 1024;

@Injectable()
export class FileUploadService {

    MultipartUploaderRef: any;
    BasicUploaderRef: any;
    singerURL: string;
    awsKey: string;
    awsRegion: string;
    filesList: any[];


    constructor(private httP: HttpClient) {
        this.MultipartUploaderRef = null;
        this.BasicUploaderRef = null;
    }

    intialiseUploader(awsInfoURL) {
        this.httP.get(awsInfoURL).subscribe(res => {
            const awsInfo: any = res;
            this.singerURL = API.getAwsSingnature;
            this.awsKey = awsInfo.AccessKey;
            this.awsRegion = awsInfo.Region;
            this.MultipartUploaderRef = Uploader.s3.UploaderMultipart.create({
                signerUrl: API.getAwsSingnature,
                timeUrl: API.getServerTime,
                aws_key: awsInfo.AccessKey,
                bucket: awsInfo.Bucket,
                aws_url: 'https://' + awsInfo.Bucket + '.s3.amazonaws.com',
                awsRegion: awsInfo.Region,
                signHeaders: {
                }
            });
        this.BasicUploaderRef = new Uploader.s3.UploaderBasic({
            request: {
              endpoint: 'https://' + awsInfo.Bucket + '.s3.amazonaws.com',
              accessKey: awsInfo.AccessKey
            },
            objectProperties: {
              bucket:  awsInfo.Bucket,
              host: 'https://' + awsInfo.Bucket + '.s3.amazonaws.com',
              key: (id) => {
                const file = this.filesList[id];
                return file.path;
              },
              region: awsInfo.Region,
              serverSideEncryption: true
            },
            signature: {
               endpoint: this.singerURL,
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
              onProgress: (id, name, uploadedBytes, totalBytes) => {
                 const file = this.filesList[id];
                         file.percentage = parseInt((((uploadedBytes / totalBytes) * 99)).toString(), 10);
                  file.progress.loaded = (uploadedBytes / 1048576) > 1 ?
                    (uploadedBytes / 1048576).toFixed(2).toString() + 'MB' :
                    (uploadedBytes / 1024).toFixed(2).toString() + 'KB';
              },
              onComplete: (id, name, success) => {
                if (success) {
                  const file = this.filesList[id];
                            file.observer.next(file);
                            file.observer.complete();
                }
              },
              onError: (id, name, errorReason) => {
                const file = this.filesList[id];
                file.observer.error(errorReason);
              }
            }
          });
          this.filesList = new Array();
        },
            err => {
                console.error(err);
            });
    }

    uploadFile(file: any, path: string= ''): Observable<any> {
        if (file.size > PART_SIZE) {
        return Observable.create(
            (observer: any) => {
                if (!this.MultipartUploaderRef) {
                    observer.error('S3 Uploader intialization failed');
                }
                this.MultipartUploaderRef.then(function (uploadingRef) {
                    file.pauseUpload = () => {
                        uploadingRef.pause(this.awsInfo.Bucket + '/' + path + '/' + file.awsKey);
                    };
                    file.resumeUpload = () => {
                        uploadingRef.resume(this.awsInfo.Bucket + '/' + path + '/' + file.awsKey);
                    };
                    file.cancelUpload = () => {
                        uploadingRef.cancel(this.awsInfo.Bucket + '/' + path + '/' + file.awsKey);
                    };
                    const addConfig = {
                        name: file.awsKey,
                        file: file,
                        xAmzHeadersAtInitiate: {
                            'x-amz-server-side-encryption' : 'AES256'
                        },
                        progress: function (progressValue, data) {
                            file.percentage = parseInt(((progressValue * 99)).toString(), 10);
                            if (data) {
                                file.progress = {
                                    loaded: data.totalUploaded ? ((data.totalUploaded / 1048576) > 1 ?
                                    (data.totalUploaded / 1048576).toFixed(2).toString() + 'MB' :
                                     (data.totalUploaded / 1024).toFixed(2).toString() + 'KB') : '',
                                    speed: data.speed ? data.readableSpeed + 'ps' : '',
                                    timeLeft: data && (data.secondsLeft >= 0) ?
                                    (data.secondsLeft > 60 ? Math.round(data.secondsLeft / 60).toString() + 'min' :
                                     Math.round(data.secondsLeft).toString() + 'sec') : '?sec'
                                };
                            }
                        }
                    };

                    const overrides = {
                        bucket: this.awsInfo.bucket + '/' + path// Shows that the bucket can be changed per
                    };

                    uploadingRef.add(addConfig, overrides)
                        .then(function (awsObjectKey) {
                            observer.next(file);
                            observer.complete();
                        },
                        function (reason) {
                            observer.error('Upload Failed' + reason);
                        });

                });

            }
        );
    }else {
        return Observable.create(
            (observer: any) => {
                if (!this.BasicUploaderRef) {
                    observer.error('S3 Uploader intialization failed');
                }
                file.path = path + '/' + file.awsKey;
                file.observer = observer;
                this.filesList.push(file);
                this.BasicUploaderRef.addFiles(file);
            }
        );
    }
    }

}
