ALTER TABLE "users" ADD COLUMN     "show_phone_in_listings" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "username" TEXT;

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
