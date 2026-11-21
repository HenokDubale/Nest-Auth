import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  // Public route: no token required
  @Public()
  @Get()
  hello() {
    return { message: 'Welcome! This is a public route.' };
  }
}
