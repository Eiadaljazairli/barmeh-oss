/*
  Warnings:

  - You are about to drop the column `is_phone_verified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `show_phone_in_listings` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_phone_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_phone_verified",
DROP COLUMN "phone",
DROP COLUMN "show_phone_in_listings";
