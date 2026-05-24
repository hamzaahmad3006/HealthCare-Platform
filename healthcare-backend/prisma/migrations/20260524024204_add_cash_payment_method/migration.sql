-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'JAZZCASH', 'STRIPE');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "collectedByUserId" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
ALTER COLUMN "stripeIdempotencyKey" DROP NOT NULL;
