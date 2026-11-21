import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  // bcrypt hash of the password (never the plain password)
  @Column()
  password: string;

  // bcrypt hash of the current refresh token; null after logout
  @Column({ type: 'varchar', nullable: true })
  refreshTokenHash: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
