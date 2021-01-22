import { HttpInterceptor, HttpHandler
,HttpRequest, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, take, filter } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';


@Injectable({
  providedIn: 'root'
})
export class ErrorhandlingService implements HttpInterceptor{

  constructor(public router: Router,
    public toastr: ToastrService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler):
  Observable<HttpEvent<any>> {
  return next.handle(req).pipe(
    catchError((error) => {

      let handled: boolean = false;
      console.error(error);

      if(error instanceof HttpErrorResponse){
        if(error.error instanceof ErrorEvent){
          console.error("Error Event");
        } else {
          console.log(`error status : ${error.status}  ${error.statusText }`);
          switch (error.status){
            // case 401:
            //   this.router.navigateByUrl("/login");
            //   this.toastr.error("Something went wrong. Please try to login again!");
            //   console.log(`redirect to login`);
            //   handled = true;
            //   break;
            case 403:
              this.router.navigateByUrl("/login");
              this.toastr.error("Something went wrong. Please try to log in again!");
              console.log(`redirect to login`);
              handled = true;
              break;
            case 404:
              this.router.navigateByUrl("");
              this.toastr.error("Something went wrong. Please try again.");
              console.log(`redirect to home`)
              handled = true;
              break;
            case 500:
              this.router.navigateByUrl("");
              this.toastr.error("Something went wrong. Please try again.");
              console.log(`redirect to home`)
              handled = true;
              break;
          }
        } 
      }
      else {
        this.router.navigateByUrl("/login");
        console.error("Other Errors");
      }

      if (handled){
        console.log('return back ');
        return of(error);
      } else {
        console.log(`throw error back to the subscriber`);
        return throwError(error);
      }
    })
  )

  

}


}
