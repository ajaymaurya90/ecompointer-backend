import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateBrandOwners() {
    const result = await prisma.$executeRaw`
  INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid(), 'test2@gmail.com', '123456', 'BRAND_OWNER', NOW(), NOW()),
    (gen_random_uuid(), 'test1@gmail.com', '123456', 'BRAND_OWNER', NOW(), NOW()),
    (gen_random_uuid(), 'test3@gmail.com', '123456', 'BRAND_OWNER', NOW(), NOW())
  ON CONFLICT (email) DO NOTHING;
`;

    console.log(`Inserted rows: ${result}`);
}

migrateBrandOwners()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });