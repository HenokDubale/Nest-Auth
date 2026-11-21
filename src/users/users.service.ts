import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: { email: string; name?: string; password: string }) {
    const user = this.repo.create({ ...data, refreshTokenHash: null });
    return this.repo.save(user);
  }

  async setRefreshTokenHash(id: number, hash: string | null) {
    await this.repo.update(id, { refreshTokenHash: hash });
  }
}
