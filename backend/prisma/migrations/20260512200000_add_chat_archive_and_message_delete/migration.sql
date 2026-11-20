ALTER TABLE "chats" ADD COLUMN "is_archived_by_a" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "chats" ADD COLUMN "is_archived_by_b" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "messages" ADD COLUMN "deleted_for_sender" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN "deleted_for_receiver" BOOLEAN NOT NULL DEFAULT false;
