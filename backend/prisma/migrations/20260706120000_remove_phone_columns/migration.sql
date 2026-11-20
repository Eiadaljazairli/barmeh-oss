DROP INDEX "users_phone_key";

ALTER TABLE "users" DROP COLUMN "is_phone_verified",
DROP COLUMN "phone",
DROP COLUMN "show_phone_in_listings";
