ALTER TYPE "NotificationType" ADD VALUE 'BOOKING';

CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bookings_seller_id_status_created_at_idx" ON "bookings"("seller_id", "status", "created_at" DESC);

CREATE INDEX "bookings_requester_id_created_at_idx" ON "bookings"("requester_id", "created_at" DESC);

CREATE INDEX "bookings_listing_id_idx" ON "bookings"("listing_id");

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
