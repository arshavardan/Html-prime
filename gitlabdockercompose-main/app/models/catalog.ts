import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApprovalPolicy } from './approvalPolicy';
import { OsTemplate } from './osTemplate';

@Entity('catalog')
export class Catalog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  icon?: string;

  @Column()
  shortName!: string;

  @ManyToOne(() => OsTemplate)
  @JoinColumn()
  defaultTemplate!: OsTemplate;

  @ManyToOne(() => ApprovalPolicy)
  @JoinColumn()
  defaultApprovalPolicy!: ApprovalPolicy;

  @Column()
  defaultLeasePeriod!: number;

  @Column()
  permittedMaxLeaseExtensions!: number;

  @Column()
  type!: 'Standard' | 'Custom';

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
