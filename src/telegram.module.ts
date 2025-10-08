import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { OrderModule } from './order.module';

@Module({
  imports: [OrderModule],
  providers: [TelegramService],
})
export class TelegramModule {}