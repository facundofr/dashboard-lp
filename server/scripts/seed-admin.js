const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  await prisma.user.deleteMany();
  console.log('Usuarios eliminados');

  const hashed = await bcrypt.hash('123456', 10);
  const user = await prisma.user.create({
    data: {
      email: 'facundo.frontend@hotmail.com',
      password: hashed,
      nombre: 'Facundo Admin',
      role: 'admin',
    }
  });
  console.log('Admin creado:', user.email, '- Role:', user.role);
  await prisma.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
