import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTimestampEntity } from '../../../shared/entities/BaseTimestamp.entity';
import { CaseEntity } from '../../cases/entities/case.entity';

@Entity('collections')
export class CollectionEntity extends BaseTimestampEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => CaseEntity, (caseEntity) => caseEntity.collections)
  case: CaseEntity;

}
