
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'alex@elsa.com' } });
    console.log('Alex found in DB:', user?.email);
    console.log('Hashed Password:', user?.password);
  } catch (e) {
    console.error('DB Operation Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
