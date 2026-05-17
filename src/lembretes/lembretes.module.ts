import { Module } from '@nestjs/common';
import { LembretesService } from './lembretes.service';
import { LembretesController } from './lembretes.controller';

@Module({
  controllers: [LembretesController],
  providers: [LembretesService],
  exports: [LembretesService],
})
export class LembretesModule {}
