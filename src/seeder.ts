
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { UserService } from './modules/user/user.service';
import { RolesService } from './modules/roles/roles.service';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Seeder');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const rolesService = app.get(RolesService);
    const userService = app.get(UserService);

    // 1. Create Roles
    const roles = ['admin', 'user'];
    for (const roleName of roles) {
      const existingRole = await rolesService.findByNames([roleName]);
      if (existingRole.length === 0) {
        logger.log(`Creating role: ${roleName}`);
        await rolesService.create({ name: roleName });
      } else {
        logger.log(`Role already exists: ${roleName}`);
      }
    }

    // 2. Create Admin User
    const adminPhoneNumber = '07700000000'; // Example admin phone
    const adminPassword = 'Secure_Pass123';
    const adminName = 'Admin';

    const existingAdmin = await userService.getByPhoneNumber(adminPhoneNumber);

    if (!existingAdmin) {
      logger.log(`Creating admin user: ${adminPhoneNumber}`);
      
      const adminRole = await rolesService.findByNames(['admin']);
      if (!adminRole || adminRole.length === 0) {
        logger.error('Admin role not found, cannot create admin user.');
        return;
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await userService.create({
        phoneNumber: adminPhoneNumber,
        password: hashedPassword, // Start with hashed password
        name: adminName,
        roles: adminRole,
        disabled: false,
      });

      logger.log(`Admin user created successfully.`);
      logger.log(`Phone: ${adminPhoneNumber}`);
      logger.log(`Password: ${adminPassword}`);
    } else {
      logger.log(`Admin user already exists: ${adminPhoneNumber}`);
    }

  } catch (error) {
    logger.error('Seeding failed', error);
  } finally {
    await app.close();
  }
}

bootstrap();
