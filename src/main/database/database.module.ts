import { Module, Global } from '@nestjs/common';
import { DatabaseService, ClientService } from './database.service';

@Global()
@Module({
  providers: [DatabaseService, ClientService],
  exports: [DatabaseService, ClientService]
})
export class DatabaseModule {}
