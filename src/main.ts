import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('SHI — Sistema de Hidratação Inteligente')
    .setDescription(
      'API REST do TCC de Engenharia da Computação. ' +
        'Monitora automaticamente o consumo de água via ESP32 + balança de precisão.',
    )
    .setVersion('1.0')
    .addTag('usuarios', 'Gerenciamento de usuários e metas')
    .addTag('recipientes', 'Cadastro e calibração de recipientes')
    .addTag('dispositivos', 'Registro de dispositivos ESP32 e ingestão de dados da balança')
    .addTag('logs-hidratacao', 'Histórico e dashboard de hidratação')
    .addTag('lembretes', 'Configuração de lembretes periódicos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
