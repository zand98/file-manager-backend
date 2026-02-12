import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTimestampEntity } from '../../../shared/entities/BaseTimestamp.entity';
import { CollectionEntity } from '../../collections/entities/collection.entity';

@Entity('cases')
export class CaseEntity extends BaseTimestampEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => CollectionEntity, (collection) => collection.case)
  collections: CollectionEntity[];
}
 