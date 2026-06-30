import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });
const prisma = new PrismaClient();

async function changeUsername() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'viewer123' }
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { username: 'view405' }
      });
      console.log('Successfully changed username from viewer123 to view405');
    } else {
      console.log('User viewer123 not found in the database.');
    }
  } catch (error) {
    console.error("Update failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

changeUsername();
