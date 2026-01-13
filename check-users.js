const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const count = await prisma.user.count();
    console.log(`\nTotal users in database: ${count}\n`);
    
    if (count > 0) {
      const users = await prisma.user.findMany();
      console.log('Users:');
      users.forEach(user => {
        console.log(`- ID: ${user.id}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Active: ${user.isActive}`);
        console.log(`  Created: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('No users found in the database.');
      console.log('You can register a new user at: http://localhost:3000/register');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
