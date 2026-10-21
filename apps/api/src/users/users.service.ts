import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '@ford/shared';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findById(id: string) {
    return this.usersRepo.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  async upsertFromSso(input: {
    email: string;
    name: string;
    ssoSubjectId: string;
    role: UserRole;
  }): Promise<User> {
    let user = await this.usersRepo.findOne({
      where: [{ ssoSubjectId: input.ssoSubjectId }, { email: input.email }],
    });

    if (!user) {
      user = this.usersRepo.create(input);
    } else {
      user.email = input.email;
      user.name = input.name;
      user.ssoSubjectId = input.ssoSubjectId;
      user.role = input.role;
    }

    return this.usersRepo.save(user);
  }
}
