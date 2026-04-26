import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/repositories/prisma.js";

const SEED_PASSWORD = "Password123!";

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  await prisma.event.deleteMany();
  await prisma.bankOffer.deleteMany();
  await prisma.auctionOpportunity.deleteMany();
  await prisma.accountUser.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.bank.deleteMany();

  const northBank = await prisma.bank.create({ data: { name: "North Bank" } });
  const summitBank = await prisma.bank.create({ data: { name: "Summit Bank" } });
  const harborBank = await prisma.bank.create({ data: { name: "Harbor Bank" } });

  const admin = await prisma.user.create({
    data: {
      email: "admin@creditly.dev",
      passwordHash,
      role: "ADMIN",
    },
  });

  const managerAlex = await prisma.user.create({
    data: {
      email: "manager.alex@creditly.dev",
      passwordHash,
      role: "MANAGER",
    },
  });
  const managerSara = await prisma.user.create({
    data: {
      email: "manager.sara@creditly.dev",
      passwordHash,
      role: "MANAGER",
    },
  });

  const userLiam = await prisma.user.create({
    data: {
      email: "user.liam@creditly.dev",
      passwordHash,
      role: "USER",
    },
  });
  const userMaya = await prisma.user.create({
    data: {
      email: "user.maya@creditly.dev",
      passwordHash,
      role: "USER",
    },
  });
  const userNoah = await prisma.user.create({
    data: {
      email: "user.noah@creditly.dev",
      passwordHash,
      role: "USER",
    },
  });
  const userAva = await prisma.user.create({
    data: {
      email: "user.ava@creditly.dev",
      passwordHash,
      role: "USER",
    },
  });

  const bankerNorthMortgage = await prisma.user.create({
    data: {
      email: "banker.north.mortgage@creditly.dev",
      passwordHash,
      role: "BANKER",
      bankId: northBank.id,
      specialisation: ["NEW_MORTGAGE", "REFINANCE"],
    },
  });
  const bankerNorthPersonal = await prisma.user.create({
    data: {
      email: "banker.north.personal@creditly.dev",
      passwordHash,
      role: "BANKER",
      bankId: northBank.id,
      specialisation: ["PERSONAL_LOAN"],
    },
  });
  const bankerSummitBusiness = await prisma.user.create({
    data: {
      email: "banker.summit.business@creditly.dev",
      passwordHash,
      role: "BANKER",
      bankId: summitBank.id,
      specialisation: ["BUSINESS_LOAN", "REFINANCE"],
    },
  });
  const bankerSummitMortgage = await prisma.user.create({
    data: {
      email: "banker.summit.mortgage@creditly.dev",
      passwordHash,
      role: "BANKER",
      bankId: summitBank.id,
      specialisation: ["NEW_MORTGAGE"],
    },
  });
  const bankerHarborPersonal = await prisma.user.create({
    data: {
      email: "banker.harbor.personal@creditly.dev",
      passwordHash,
      role: "BANKER",
      bankId: harborBank.id,
      specialisation: ["PERSONAL_LOAN", "BUSINESS_LOAN"],
    },
  });
  const bankerHarborRefinance = await prisma.user.create({
    data: {
      email: "banker.harbor.refinance@creditly.dev",
      passwordHash,
      role: "BANKER",
      bankId: harborBank.id,
      specialisation: ["REFINANCE"],
    },
  });

  const account1 = await prisma.account.create({
    data: {
      managerId: managerAlex.id,
      costumerEmail: "client.owen@example.com",
      costumerPhone: "+1-555-1010",
      costumerName: "Owen Carter",
      status: "WON",
      lastActivity: daysAgo(2),
      isHighActivity: true,
      syncStatus: "SYNCED",
      failureReason: null,
    },
  });
  const account2 = await prisma.account.create({
    data: {
      managerId: managerAlex.id,
      costumerEmail: "client.emma@example.com",
      costumerPhone: "+1-555-1011",
      costumerName: "Emma Ortiz",
      status: "AUCTION_OPEN",
      lastActivity: daysAgo(1),
      isHighActivity: true,
      syncStatus: "SYNCED",
      failureReason: null,
    },
  });
  const account3 = await prisma.account.create({
    data: {
      managerId: managerAlex.id,
      costumerEmail: "client.olivia@example.com",
      costumerPhone: "+1-555-1012",
      costumerName: "Olivia Brooks",
      status: "READY_FOR_AUCTION",
      lastActivity: daysAgo(3),
      isHighActivity: false,
      syncStatus: "FAILED",
      failureReason: "CRM mock rejected (event:document_uploaded)",
    },
  });
  const account4 = await prisma.account.create({
    data: {
      managerId: managerSara.id,
      costumerEmail: "client.jacob@example.com",
      costumerPhone: "+1-555-1013",
      costumerName: "Jacob Reed",
      status: "AUCTION_OPEN",
      lastActivity: daysAgo(5),
      isHighActivity: false,
      syncStatus: "FAILED",
      failureReason: "CRM mock rejected (event:auction_opened)",
    },
  });
  const account5 = await prisma.account.create({
    data: {
      managerId: managerSara.id,
      costumerEmail: "client.sophia@example.com",
      costumerPhone: "+1-555-1014",
      costumerName: "Sophia Miles",
      status: "NEW",
      lastActivity: daysAgo(10),
      isHighActivity: false,
      syncStatus: "SYNCED",
      failureReason: null,
    },
  });
  const account6 = await prisma.account.create({
    data: {
      managerId: managerSara.id,
      costumerEmail: "client.ethan@example.com",
      costumerPhone: "+1-555-1015",
      costumerName: "Ethan Foster",
      status: "WON",
      lastActivity: daysAgo(4),
      isHighActivity: true,
      syncStatus: "SYNCED",
      failureReason: null,
    },
  });
  const account7 = await prisma.account.create({
    data: {
      managerId: managerAlex.id,
      costumerEmail: "client.mia@example.com",
      costumerPhone: "+1-555-1016",
      costumerName: "Mia Hayes",
      status: "READY_FOR_AUCTION",
      lastActivity: daysAgo(2),
      isHighActivity: false,
      syncStatus: "FAILED",
      failureReason: "CRM mock rejected (event:status_changed)",
    },
  });
  const account8 = await prisma.account.create({
    data: {
      managerId: managerSara.id,
      costumerEmail: "client.noah@example.com",
      costumerPhone: "+1-555-1017",
      costumerName: "Noah Bennett",
      status: "AUCTION_OPEN",
      lastActivity: daysAgo(1),
      isHighActivity: true,
      syncStatus: "SYNCED",
      failureReason: null,
    },
  });

  await prisma.accountUser.createMany({
    data: [
      { accountId: account1.id, userId: userLiam.id },
      { accountId: account1.id, userId: userMaya.id },
      { accountId: account2.id, userId: userLiam.id },
      { accountId: account3.id, userId: userMaya.id },
      { accountId: account4.id, userId: userNoah.id },
      { accountId: account5.id, userId: userAva.id },
      { accountId: account6.id, userId: userNoah.id },
      { accountId: account6.id, userId: userAva.id },
      { accountId: account7.id, userId: userMaya.id },
      { accountId: account7.id, userId: userAva.id },
      { accountId: account8.id, userId: userLiam.id },
      { accountId: account8.id, userId: userNoah.id },
    ],
  });

  const auction1 = await prisma.auctionOpportunity.create({
    data: {
      accountId: account1.id,
      classification: "REFINANCE",
      status: "CLOSED",
      openedBy: managerAlex.id,
      openedAt: daysAgo(7),
      expiresAt: daysAgo(4),
      closedAt: daysAgo(4),
    },
  });
  const auction2 = await prisma.auctionOpportunity.create({
    data: {
      accountId: account2.id,
      classification: "NEW_MORTGAGE",
      status: "OPEN",
      openedBy: managerAlex.id,
      openedAt: daysAgo(1),
      expiresAt: daysFromNow(2),
      closedAt: null,
    },
  });
  const auction4 = await prisma.auctionOpportunity.create({
    data: {
      accountId: account4.id,
      classification: "PERSONAL_LOAN",
      status: "EXPIRED",
      openedBy: managerSara.id,
      openedAt: daysAgo(6),
      expiresAt: daysAgo(3),
      closedAt: daysAgo(3),
    },
  });
  const auction6 = await prisma.auctionOpportunity.create({
    data: {
      accountId: account6.id,
      classification: "BUSINESS_LOAN",
      status: "CLOSED",
      openedBy: managerSara.id,
      openedAt: daysAgo(8),
      expiresAt: daysAgo(5),
      closedAt: daysAgo(5),
    },
  });
  const auction8 = await prisma.auctionOpportunity.create({
    data: {
      accountId: account8.id,
      classification: "REFINANCE",
      status: "OPEN",
      openedBy: managerSara.id,
      openedAt: daysAgo(2),
      expiresAt: daysFromNow(1),
      closedAt: null,
    },
  });

  const offerA1North = await prisma.bankOffer.create({
    data: {
      auctionOpportunityId: auction1.id,
      bankId: northBank.id,
      bankerId: bankerNorthMortgage.id,
      totalInterestRate: 3.45,
      createdAt: daysAgo(6),
    },
  });
  const offerA1Summit = await prisma.bankOffer.create({
    data: {
      auctionOpportunityId: auction1.id,
      bankId: summitBank.id,
      bankerId: bankerSummitBusiness.id,
      totalInterestRate: 3.2,
      createdAt: daysAgo(6),
    },
  });
  const offerA1Harbor = await prisma.bankOffer.create({
    data: {
      auctionOpportunityId: auction1.id,
      bankId: harborBank.id,
      bankerId: bankerHarborRefinance.id,
      totalInterestRate: 3.3,
      createdAt: daysAgo(6),
    },
  });

  await prisma.auctionOpportunity.update({
    where: { id: auction1.id },
    data: { winningOfferId: offerA1Summit.id },
  });

  const offerA2Summit = await prisma.bankOffer.create({
    data: {
      auctionOpportunityId: auction2.id,
      bankId: summitBank.id,
      bankerId: bankerSummitMortgage.id,
      totalInterestRate: 4.85,
      createdAt: daysAgo(1),
    },
  });
  const offerA2North = await prisma.bankOffer.create({
    data: {
      auctionOpportunityId: auction2.id,
      bankId: northBank.id,
      bankerId: bankerNorthMortgage.id,
      totalInterestRate: 4.7,
      createdAt: daysAgo(1),
    },
  });

  const offerA6Summit = await prisma.bankOffer.create({
    data: {
      auctionOpportunityId: auction6.id,
      bankId: summitBank.id,
      bankerId: bankerSummitBusiness.id,
      totalInterestRate: 6.4,
      createdAt: daysAgo(6),
    },
  });
  const offerA6Harbor = await prisma.bankOffer.create({
    data: {
      auctionOpportunityId: auction6.id,
      bankId: harborBank.id,
      bankerId: bankerHarborPersonal.id,
      totalInterestRate: 6.1,
      createdAt: daysAgo(6),
    },
  });
  const offerA6North = await prisma.bankOffer.create({
    data: {
      auctionOpportunityId: auction6.id,
      bankId: northBank.id,
      bankerId: bankerNorthPersonal.id,
      totalInterestRate: 6.35,
      createdAt: daysAgo(6),
    },
  });

  await prisma.auctionOpportunity.update({
    where: { id: auction6.id },
    data: { winningOfferId: offerA6Harbor.id },
  });

  const offerA8Harbor = await prisma.bankOffer.create({
    data: {
      auctionOpportunityId: auction8.id,
      bankId: harborBank.id,
      bankerId: bankerHarborRefinance.id,
      totalInterestRate: 5.05,
      createdAt: daysAgo(1),
    },
  });

  await prisma.event.createMany({
    data: [
      {
        accountId: account1.id,
        userId: userLiam.id,
        type: "DOCUMENT_UPLOADED",
        createdAt: daysAgo(8),
        metadata: { source: "seed" },
      },
      {
        accountId: account1.id,
        userId: managerAlex.id,
        type: "AUCTION_OPENED",
        createdAt: daysAgo(7),
        metadata: { auctionId: auction1.id },
      },
      {
        accountId: account1.id,
        userId: bankerSummitBusiness.id,
        type: "OFFER_SUBMITTED",
        createdAt: daysAgo(6),
        metadata: { auctionId: auction1.id, offerId: offerA1Summit.id, totalInterestRate: 3.2 },
      },
      {
        accountId: account1.id,
        userId: managerAlex.id,
        type: "AUCTION_CLOSED",
        createdAt: daysAgo(4),
        metadata: { auctionId: auction1.id },
      },
      {
        accountId: account2.id,
        userId: userMaya.id,
        type: "DOCUMENT_UPLOADED",
        createdAt: daysAgo(2),
        metadata: { source: "seed" },
      },
      {
        accountId: account2.id,
        userId: managerAlex.id,
        type: "AUCTION_OPENED",
        createdAt: daysAgo(1),
        metadata: { auctionId: auction2.id },
      },
      {
        accountId: account2.id,
        userId: bankerNorthMortgage.id,
        type: "OFFER_SUBMITTED",
        createdAt: daysAgo(1),
        metadata: { auctionId: auction2.id, offerId: offerA2North.id, totalInterestRate: 4.7 },
      },
      {
        accountId: account3.id,
        userId: userMaya.id,
        type: "NOTE_ADDED",
        createdAt: daysAgo(3),
        metadata: { note: "Customer requested follow-up." },
      },
      {
        accountId: account4.id,
        userId: managerSara.id,
        type: "AUCTION_OPENED",
        createdAt: daysAgo(6),
        metadata: { auctionId: auction4.id },
      },
      {
        accountId: account5.id,
        userId: userAva.id,
        type: "DOCUMENT_UPLOADED",
        createdAt: daysAgo(10),
        metadata: { source: "seed" },
      },
      {
        accountId: account6.id,
        userId: managerSara.id,
        type: "AUCTION_OPENED",
        createdAt: daysAgo(8),
        metadata: { auctionId: auction6.id },
      },
      {
        accountId: account6.id,
        userId: bankerHarborPersonal.id,
        type: "OFFER_SUBMITTED",
        createdAt: daysAgo(6),
        metadata: { auctionId: auction6.id, offerId: offerA6Harbor.id, totalInterestRate: 6.1 },
      },
      {
        accountId: account6.id,
        userId: managerSara.id,
        type: "AUCTION_CLOSED",
        createdAt: daysAgo(5),
        metadata: { auctionId: auction6.id },
      },
      {
        accountId: account7.id,
        userId: userAva.id,
        type: "STATUS_CHANGED",
        createdAt: daysAgo(2),
        metadata: { from: "NEW", to: "READY_FOR_AUCTION" },
      },
      {
        accountId: account8.id,
        userId: managerSara.id,
        type: "AUCTION_OPENED",
        createdAt: daysAgo(2),
        metadata: { auctionId: auction8.id },
      },
      {
        accountId: account8.id,
        userId: bankerHarborRefinance.id,
        type: "OFFER_SUBMITTED",
        createdAt: daysAgo(1),
        metadata: { auctionId: auction8.id, offerId: offerA8Harbor.id, totalInterestRate: 5.05 },
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Password for all seeded users: Password123!");
  console.log(
    [
      admin.email,
      managerAlex.email,
      managerSara.email,
      userLiam.email,
      userMaya.email,
      userNoah.email,
      userAva.email,
      bankerNorthMortgage.email,
      bankerNorthPersonal.email,
      bankerSummitBusiness.email,
      bankerSummitMortgage.email,
      bankerHarborPersonal.email,
      bankerHarborRefinance.email,
    ].join("\n")
  );
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.stack ?? e.message : String(e));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
