// src/common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class PasswordRemoverInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const controllerName = context.getClass().name;

    // Skip this interceptor for AuthController
    if (controllerName === 'AuthController') {
      return next.handle();
    }
    return next.handle().pipe(
      map((data) => instanceToPlain(data)), // This will remove @Exclude fields like password
    );
  }
}
