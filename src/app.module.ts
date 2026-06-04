import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { RecipientesModule } from './recipientes/recipientes.module';
import { DispositivosModule } from './dispositivos/dispositivos.module';
import { LogsHidratacaoModule } from './logs-hidratacao/logs-hidratacao.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    GatewayModule,
    UsuariosModule,
    RecipientesModule,
    DispositivosModule,
    LogsHidratacaoModule,
  ],
})
export class AppModule {}
