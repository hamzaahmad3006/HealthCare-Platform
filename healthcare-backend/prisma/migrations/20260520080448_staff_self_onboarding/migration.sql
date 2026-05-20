-- DropForeignKey
ALTER TABLE "staff_profiles" DROP CONSTRAINT "staff_profiles_cityId_fkey";

-- AlterTable
ALTER TABLE "staff_profiles" ADD COLUMN     "profileCompletedAt" TIMESTAMP(3),
ALTER COLUMN "cityId" DROP NOT NULL,
ALTER COLUMN "cnic" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
