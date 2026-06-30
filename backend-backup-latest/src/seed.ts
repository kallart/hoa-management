import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // 1. Create Default Setting
  await prisma.setting.create({
    data: {
      villageName: 'หมู่บ้านรชวดี',
      commonAreaRate: 15.0, // 15 baht per sq wah
    }
  });

  // 2. Create 100 Properties
  const propertiesData = Array.from({ length: 100 }).map((_, i) => {
    const houseNo = `99/${i + 1}`;
    // Random land area between 50 and 100
    const landArea = Math.floor(Math.random() * 50) + 50;
    // Calculate rate
    const ratePerYear = landArea * 15.0 * 12; // monthly rate * 12
    return {
      houseNumber: houseNo,
      landArea: landArea,
      ratePerYear: ratePerYear,
      status: 'active'
    };
  });

  for (const p of propertiesData) {
    const prop = await prisma.property.create({ data: p });
    // Create Owner
    await prisma.owner.create({
      data: {
        propertyId: prop.id,
        name: `เจ้าของบ้าน ${prop.houseNumber}`,
        phone: `081234${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      }
    });
  }

  console.log('Seeding completed: 100 houses created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
