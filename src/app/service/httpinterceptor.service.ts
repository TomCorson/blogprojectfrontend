import { HttpHandler, HttpInterceptor, HttpRequest, 
  HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthserviceService } from './authservice.service';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, take, filter } from 'rxjs/operators';
import { LoginResponse } from '../login/login.response.payload';
import { Router } from '@angular/router';
import { ifError } from 'assert';
import { ToastrService } from 'ngx-toastr';

@Injectable({
providedIn: 'root'
})

export class HttpinterceptorService implements HttpInterceptor {

  isTokenRefreshing = false;
  
 private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>({});

  constructor(public authService: AuthserviceService, 
    public router: Router,
    public toastr: ToastrService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler):
      Observable<HttpEvent<any>> {

        return next.handle(req).pipe(catchError(error =>{
          if(req.url.includes("refresh") || 
            req.url.includes("login")
        ){
            if(req.url.includes("refresh")) {
              this.authService.logout();
            }
            return next.handle(req);
           // return Observable.throw(error);
        }
      
  
          const jwtToken = this.authService.getJwtToken();

          if(jwtToken){
            return next.handle(this.addToken(req, jwtToken)).pipe(catchError(error => {
              if(error instanceof HttpErrorResponse
                && error.status === 401){
                  return this.handleAuthErrors(req, next);
                } else {
                          this.router.navigateByUrl("/login");
                          return throwError(error);
                        }
                    }));
                  }
                  return next.handle(req)

        } )) 
      }
  
        handleAuthErrors(req: HttpRequest<any>, next: HttpHandler) : Observable<HttpEvent<any>>{
         if(!this.isTokenRefreshing){
           this.isTokenRefreshing = true;
          this.refreshTokenSubject.next(null);

           return this.authService.refreshToken()
          .pipe(
            switchMap((refreshTokenResponse: LoginResponse) => {
               this.isTokenRefreshing = false;
                this.refreshTokenSubject
                .next(refreshTokenResponse.authenticationToken);
                return next.handle(this.addToken(req, refreshTokenResponse.authenticationToken))
             })
           )
         } else {
           return this.refreshTokenSubject.pipe(
                 filter(result => result !== null),
                 take(1),
                 switchMap((res) => {
                   return next.handle(this.addToken(req, 
                     this.authService.getRefreshToken()))
                 })
           );
         }
       }

        addToken(req: HttpRequest<any>, jwtToken: any){
    
         return req.clone({
           headers: req.headers.set('Authorization',
           'Bearer ' + jwtToken)
        });
      }
}