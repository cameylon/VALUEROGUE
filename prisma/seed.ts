import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "staff@ldsnexus.test" },
      update: {},
      create: {
        name: "Sam Staff",
        email: "staff@ldsnexus.test",
        passwordHash,
        role: Role.STAFF,
        status: UserStatus.ACTIVE
      }
    }),
    prisma.user.upsert({
      where: { email: "quality@ldsnexus.test" },
      update: {},
      create: {
        name: "Quinn Quality",
        email: "quality@ldsnexus.test",
        passwordHash,
        role: Role.QUALITY_SAFETY,
        status: UserStatus.ACTIVE
      }
    }),
    prisma.user.upsert({
      where: { email: "leader@ldsnexus.test" },
      update: {},
      create: {
        name: "Taylor Leader",
        email: "leader@ldsnexus.test",
        passwordHash,
        role: Role.TEAM_LEADER,
        status: UserStatus.ACTIVE
      }
    }),
    prisma.user.upsert({
      where: { email: "admin@ldsnexus.test" },
      update: {},
      create: {
        name: "Alex Admin",
        email: "admin@ldsnexus.test",
        passwordHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE
      }
    })
  ]);

  const home = await prisma.home.upsert({
    where: { id: "seed-home" },
    update: {},
    create: {
      id: "seed-home",
      name: "Hope House",
      suburb: "Adelaide",
      supportRatio: "1:3",
      featuresJson: { accessibility: true, sensoryRoom: true },
      active: true
    }
  });

  const client = await prisma.client.upsert({
    where: { id: "seed-client" },
    update: {},
    create: {
      id: "seed-client",
      preferredName: "Jamie",
      legalName: "",
      notes: "Prefers quiet mornings."
    }
  });

  await prisma.shift.upsert({
    where: { id: "seed-shift" },
    update: {},
    create: {
      id: "seed-shift",
      homeId: home.id,
      clientId: client.id,
      start: new Date(Date.now() + 3600 * 1000),
      end: new Date(Date.now() + 9 * 3600 * 1000),
      requiredSkills: ["Medication", "Mobility"],
      status: "OPEN"
    }
  });

  await prisma.availability.upsert({
    where: { userId: users[0].id },
    update: {},
    create: {
      userId: users[0].id,
      preferredHours: { monday: "08:00-16:00", tuesday: "08:00-16:00" },
      blackoutDates: []
    }
  });

  await prisma.systemSetting.createMany({
    data: [
      {
        category: "COMPLIANCE",
        key: "highSeverityFollowupHours",
        valueJson: { hours: 24 }
      },
      {
        category: "ROSTER",
        key: "maxHoursPerWeek",
        valueJson: { hours: 40 }
      },
      {
        category: "ROSTER",
        key: "minRestHours",
        valueJson: { hours: 10 }
      },
      {
        category: "REDACTION",
        key: "enabled",
        valueJson: { enabled: true }
      }
    ],
    skipDuplicates: true
  });

  console.log("Seeded users:");
  console.table(users.map((user) => ({ id: user.id, email: user.email, role: user.role })));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
