-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 120,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePrice" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "material" TEXT NOT NULL DEFAULT 'synthetic',
    "amount" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'item',
    "preliminary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServicePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "travelMinutes" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSchedule" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "breakStart" INTEGER,
    "breakEnd" INTEGER,

    CONSTRAINT "TeamSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleException" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMPTZ(3),
    "endsAt" TIMESTAMPTZ(3),
    "holdExpiresAt" TIMESTAMPTZ(3),
    "address" TEXT NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "internalComment" TEXT NOT NULL DEFAULT '',
    "total" INTEGER NOT NULL,
    "quote" JSONB NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentVersion" TEXT NOT NULL DEFAULT '2026-11-10',
    "idempotencyKey" TEXT NOT NULL,
    "accessTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingItem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "parameters" JSONB NOT NULL,

    CONSTRAINT "BookingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingResourceAllocation" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BookingResourceAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingStatusHistory" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "beforeImage" TEXT NOT NULL,
    "afterImage" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rightsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sourceUrl" TEXT,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 1,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePrice_serviceId_label_material_key" ON "ServicePrice"("serviceId", "label", "material");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSchedule_teamId_weekday_key" ON "TeamSchedule"("teamId", "weekday");

-- CreateIndex
CREATE INDEX "ScheduleException_teamId_startsAt_endsAt_idx" ON "ScheduleException"("teamId", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_number_key" ON "Booking"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Booking_status_startsAt_idx" ON "Booking"("status", "startsAt");

-- CreateIndex
CREATE INDEX "Booking_holdExpiresAt_idx" ON "Booking"("holdExpiresAt");

-- CreateIndex
CREATE INDEX "BookingResourceAllocation_teamId_active_startsAt_endsAt_idx" ON "BookingResourceAllocation"("teamId", "active", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "FAQ_question_key" ON "FAQ"("question");

-- CreateIndex
CREATE INDEX "NotificationLog_status_createdAt_idx" ON "NotificationLog"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePrice" ADD CONSTRAINT "ServicePrice_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSchedule" ADD CONSTRAINT "TeamSchedule_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingResourceAllocation" ADD CONSTRAINT "BookingResourceAllocation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingResourceAllocation" ADD CONSTRAINT "BookingResourceAllocation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStatusHistory" ADD CONSTRAINT "BookingStatusHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Last line of defence: concurrent transactions cannot overlap a team's allocations.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "BookingResourceAllocation" ADD CONSTRAINT "team_no_overlapping_bookings"
 EXCLUDE USING gist ("teamId" WITH =, tstzrange("startsAt", "endsAt", '[)') WITH &&) WHERE (active);
ALTER TABLE "BookingResourceAllocation" ADD CONSTRAINT "allocation_positive_duration" CHECK ("endsAt">"startsAt");
ALTER TABLE "ScheduleException" ADD CONSTRAINT "exception_positive_duration" CHECK ("endsAt">"startsAt");
ALTER TABLE "ServicePrice" ADD CONSTRAINT "price_nonnegative" CHECK (amount>=0);
ALTER TABLE "TeamSchedule" ADD CONSTRAINT "valid_work_hours" CHECK ("startMinute">=0 AND "endMinute"<=1439 AND "endMinute">"startMinute");
