import { Controller, Get, NotFoundException } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Protected route (the global guard requires a valid access token)
  @Get('me')
  async me(@CurrentUser() current: { userId: number }) {
    const user = await this.users.findById(current.userId);
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}
