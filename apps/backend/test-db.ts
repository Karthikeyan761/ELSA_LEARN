
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users in DB:', users.map(u => u.email));
  } catch (e) {
    console.error('DB Connection Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
