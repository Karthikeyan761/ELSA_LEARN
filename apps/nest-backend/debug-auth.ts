import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const allUsers = await prisma.user.findMany();
  console.log('Total users:', allUsers.length);
  console.log('Emails:', allUsers.map(u => u.email).join(', '));
  
  const email = 'teacher@elsa.com';
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log('✅ User found:', user.email);
  console.log('Hash in DB:', user.password);
  
  const pass = 'teacher123';
  const isValid = await bcrypt.compare(pass, user.password);
  console.log('Is valid:', isValid);
}

main().catch(console.error).finally(() => prisma.$disconnect());
