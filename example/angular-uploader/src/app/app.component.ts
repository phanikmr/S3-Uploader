import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FileUploadService } from './file-upload.service';
import { APIServie } from './api.service';
import { Utilities } from './utils.service';


const MAX_UPLOAD_RETRIES = 3;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {


  @ViewChild('fileInput') fileInput: ElementRef;
  filesList: any[];
  folderDetails: any;
  filesToBeUploaded: number;
  filesUploaded: number;
  disableUpload: boolean;


  constructor(private fileUploadService: FileUploadService, private apiService: APIServie) {

    this.filesList = new Array<File>();
    this.folderDetails = {
      FolderName: ''
    };
    this.filesToBeUploaded = 0;
    this.filesUploaded = 0;
    this.disableUpload = false;
  }

  ngOnInit() {

    const unloadEvent = (e) => {
      if (this.disableUpload) {
        const confirmationMessage =
          'Warning: Leaving this page will result in any unsaved data being lost. Are you sure you wish to continue?';
        (e || window.event).returnValue = confirmationMessage; // Gecko + IE
        return confirmationMessage; // Webkit, Safari, Chrome etc.
      }
    };
    window.addEventListener('beforeunload', unloadEvent);
    window.onunload = () => {
      this.filesList.forEach((file, index, arr) => {
        if (file.percentage !== 100) {
          file.cancelUpload();
        }
      });
    };
  }

  ngOnDestroy() {

  }


  openfileDialog() {
    this.fileInput.nativeElement.click();
  }

  fileschoosed(event: any) {
    for (let i = 0; i < event.srcElement.files.length; i++) {
      let file: any;
      file = this.initialiseFile(event.srcElement.files[i]);
      this.filesList.push(file);
    }
    Utilities.removeDuplicateFiles(this.filesList);
    this.filesToBeUploaded = Math.abs(this.filesToBeUploaded - this.filesUploaded);
  }

  onDrop(event: any) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      let file: any;
      file = this.initialiseFile(files[i]);
      this.filesList.push(file);
    }
    Utilities.removeDuplicateFiles(this.filesList);
  }


  initialiseFile(file: any): any {
    file.awsGuid = Utilities.generateUUID();
    file.retryCount = 0;
    file.progress = {
      loaded: '0 KB',
      speed: '0 Kbps',
      timeLeft: '? sec'
    };
    file.percentage = 0;
    file.readableSize = (file.size / 1048576) > 1 ?
      (file.size / 1048576).toFixed(2).toString() + 'MB' :
      (file.size / 1024).toFixed(2).toString() + 'KB';
    file.filetype = file.name.substr(file.name.lastIndexOf('.'), file.name.length);
    file.awsKey = file.awsGuid + file.filetype;
    return file;
  }

  onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  onDragLeave(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  uploadSessionFiles() {
    this.disableUpload = true;

    this.filesList.forEach((file) => {
      this.uploadFile(file);
    });

  }

  cancelUpload(file: any, index: number) {

    if (this.disableUpload) {
      file.cancelUpload();
    }
    this.filesList.splice(index, 1);

  }


  changeUploader(useFineUploader: boolean = true) {
  }

  uploadFile(file: any) {
    this.fileUploadService.uploadFile(file, 'path/folder').subscribe(
      (uploadedFile) => {
        this.updateMetaDataInDB(uploadedFile);
      },
      (err) => {
        file.failed = true;
      }
    );
  }

  updateMetaDataInDB(uploadedFile: any) {
    this.apiService.updateDB(uploadedFile).subscribe(
      (res) => {
        this.filesUploaded++;
        if (this.filesUploaded === this.filesList.length) {
          this.completeUploadTasks();
        }
        console.log('File Uploaded', uploadedFile);
      },
      (err) => {
        console.log(err);
        uploadedFile.retryCount++;
        if (uploadedFile.retryCount < MAX_UPLOAD_RETRIES) {
          console.log('Retrying failed upload');
          setTimeout(() => {
            this.updateMetaDataInDB(uploadedFile);
          },
            3000);
        }
      }
    );
  }

  completeUploadTasks() {
      console.log('Upload Session completed');
      window.close();
  }

}
