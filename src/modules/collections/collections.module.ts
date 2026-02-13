import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { CollectionEntity } from './entities/collection.entity';
import { CaseEntity } from 'src/modules/cases/entities/case.entity';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CollectionEntity, CaseEntity]),
    forwardRef(() => FilesModule),
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
