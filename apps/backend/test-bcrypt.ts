
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function test() {
  const email = 'alex@elsa.com';
  const rawPassword = 'student123';
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return console.log('User not found');
    const isMatch = await bcrypt.compare(rawPassword, user.password);
    console.log(`Password match for ${email}:`, isMatch);
  } catch (e) {
    console.error('Test Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
