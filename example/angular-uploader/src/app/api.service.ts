import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Utilities } from './utils.service';
import 'rxjs/add/operator/map';

import { API } from './constants';


@Injectable()

export class APIServie {

  constructor(private httpClient: HttpClient) {

  }


  updateDB(file: any): Observable<any> {
    // fake call
    return Observable.create(
      (observer) => {
          observer.next(file);
          observer.complete();
      }
    );
  }




  getAWSDetails(): Observable<any> {
    return this.httpClient.get(API.getAWSInfo);
  }


}
