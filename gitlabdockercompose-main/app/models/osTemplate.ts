import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { OsFamily } from './osFamily.js';
import { Location } from './location.js';

@Entity('os_template')
export class OsTemplate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  templateId!: string;

  @ManyToOne(() => OsFamily)
  @JoinColumn()
  osFamily!: OsFamily;

  @ManyToOne(() => Location)
  @JoinColumn()
  location!: Location;

  @Column()
  availableNetwork!: string;

  @Column({ nullable: true })
  createdBy!: string;

  @Column({ nullable: true })
  updatedBy!: string;

  @Column({ nullable: true })
  deletedBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
