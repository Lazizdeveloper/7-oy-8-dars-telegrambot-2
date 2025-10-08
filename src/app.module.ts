import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramModule } from './telegram.module';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DB_URI ?? (() => { throw new Error('.env faylida DB_URI aniqlanmagan'); })()),
    TelegramModule,
  ],
})
export class AppModule {}