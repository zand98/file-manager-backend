import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTimestampEntity } from '../../../shared/entities/BaseTimestamp.entity';
import { CollectionEntity } from '../../collections/entities/collection.entity';

export enum FileStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('files')
export class FileEntity extends BaseTimestampEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  original_name: string;

  @Column()
  mime_type: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column()
  s3_key: string;

  @Column({ type: 'varchar', default: FileStatus.PENDING })
  status: FileStatus;

  @Column({ nullable: true })
  upload_id: string; // For multipart uploads

  @ManyToOne(() => CollectionEntity, (collection) => collection.files)
  collection: CollectionEntity;
}
