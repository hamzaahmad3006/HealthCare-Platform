CREATE TABLE "booking_creation_requests" (
    "id" VARCHAR(64) NOT NULL,
    "requestHash" VARCHAR(64) NOT NULL,
    "bookingId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_creation_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_creation_requests_expiresAt_idx" ON "booking_creation_requests"("expiresAt");
CREATE INDEX "booking_creation_requests_bookingId_idx" ON "booking_creation_requests"("bookingId");
ALTER TABLE "booking_creation_requests" ADD CONSTRAINT "booking_creation_requests_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
