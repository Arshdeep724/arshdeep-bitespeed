import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth(): string {
    return this.appService.getHealth();
  }

  @HttpCode(200)
  @Post('identify') 
  async identify(@Body() body: {
    email?: string,
    phoneNumber?: string
  }) {
    return this.appService.identify(body.email,body.phoneNumber);
  }
}
