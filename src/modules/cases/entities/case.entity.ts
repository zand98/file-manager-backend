import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTimestampEntity } from '../../../shared/entities/BaseTimestamp.entity';

@Entity('cases')
export class CaseEntity extends BaseTimestampEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
 