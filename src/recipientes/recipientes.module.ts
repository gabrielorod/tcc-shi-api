import { Module } from '@nestjs/common';
import { RecipientesService } from './recipientes.service';
import { RecipientesController } from './recipientes.controller';

@Module({
  controllers: [RecipientesController],
  providers: [RecipientesService],
  exports: [RecipientesService],
})
export class RecipientesModule {}
