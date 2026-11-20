CREATE TYPE "IdentityStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED');

CREATE TYPE "TrustLevel" AS ENUM ('NEWBIE', 'VERIFIED', 'TRUSTED', 'VIP');

CREATE TYPE "City" AS ENUM ('DAMASCUS', 'RURAL_DAMASCUS', 'ALEPPO', 'HOMS', 'HAMA', 'LATAKIA', 'TARTUS', 'IDLIB', 'DEIR_EZ_ZOR', 'RAQQA', 'HASAKAH', 'DARAA', 'SUWAYDA', 'QUNEITRA', 'QAMISHLI');

CREATE TYPE "Currency" AS ENUM ('SYP', 'USD', 'TRY', 'EUR');

CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'PENDING', 'RESERVED', 'SOLD', 'BLOCKED', 'DELETED', 'EXPIRED');

CREATE TYPE "ModerationStatus" AS ENUM ('APPROVED', 'PENDING', 'FLAGGED', 'REJECTED', 'AUTO_REJECTED');

CREATE TYPE "PriceStatus" AS ENUM ('FIXED', 'NEGOTIABLE', 'FREE');

CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

CREATE TYPE "UserType" AS ENUM ('MERCHANT', 'CONSUMER');

CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED', 'ESCALATED_TO_POLICE');

CREATE TYPE "NotificationType" AS ENUM ('INFO', 'PROMO', 'MESSAGE', 'LISTING_UPDATE', 'SYSTEM');

CREATE TYPE "PromotionType" AS ENUM ('TOP_PLACEMENT', 'FEATURED', 'URGENT');

CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'USDT', 'SYRIATEL_CASH', 'MTN_CASH', 'BANK_TRANSFER', 'FREE');

CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "avatar_url" TEXT,
    "trust_score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "last_location_lat" DOUBLE PRECISION,
    "last_location_lng" DOUBLE PRECISION,
    "age" INTEGER,
    "gender" "Gender",
    "governorate" "City",
    "sub_location" TEXT,
    "user_type" "UserType" NOT NULL DEFAULT 'CONSUMER',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "identity_status" "IdentityStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "trust_level" "TrustLevel" NOT NULL DEFAULT 'NEWBIE',
    "google_id" TEXT,
    "password" TEXT,
    "refresh_token" TEXT,
    "expo_push_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "merchant_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "store_name" TEXT NOT NULL,
    "store_address" TEXT,
    "tax_id" TEXT,
    "business_hours" JSONB DEFAULT '{}',
    "logo_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "reviewed_user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_blocks" (
    "id" TEXT NOT NULL,
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "login_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "device_id" TEXT,
    "device_name" TEXT,
    "user_agent" TEXT,
    "ip" TEXT,
    "country" TEXT,
    "refresh_token_hash" TEXT,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "revoke_reason" TEXT,

    CONSTRAINT "login_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "icon" TEXT,
    "parent_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'SYP',
    "price_status" "PriceStatus" NOT NULL DEFAULT 'NEGOTIABLE',
    "discount" BOOLEAN NOT NULL DEFAULT false,
    "discount_percentage" INTEGER,
    "city" "City" NOT NULL,
    "sub_location" TEXT,
    "category_id" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB DEFAULT '{}',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "bumped_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "moderation_score" DOUBLE PRECISION,
    "moderation_reason" TEXT,
    "moderation_flagged_by" TEXT,
    "report_count" INTEGER NOT NULL DEFAULT 0,
    "promotion_type" "PromotionType",
    "promotion_expires_at" TIMESTAMP(3),
    "promotion_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "thumb_url" TEXT NOT NULL,
    "medium_url" TEXT NOT NULL,
    "hash" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "favorites" (
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id","listing_id")
);

CREATE TABLE "chats" (
    "id" TEXT NOT NULL,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "listing_id" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "reported_user_id" TEXT,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "moderation_logs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT,
    "message_id" TEXT,
    "user_id" TEXT,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "source" TEXT NOT NULL,
    "raw_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" "City",
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "is_escalated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ticket_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "sender_id" TEXT,
    "is_admin_reply" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ticket_attachments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "message_id" TEXT,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "reference_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_preferences" (
    "user_id" TEXT NOT NULL,
    "messages" BOOLEAN NOT NULL DEFAULT true,
    "newListings" BOOLEAN NOT NULL DEFAULT true,
    "priceUpdates" BOOLEAN NOT NULL DEFAULT true,
    "system" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "query" TEXT,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "last_notified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "promotion_products" (
    "id" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "price_syp" INTEGER NOT NULL,
    "label" TEXT,
    "discount_percent" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "product_id" TEXT NOT NULL,
    "amount_syp" INTEGER NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gateway_ref" TEXT,
    "gateway_response" JSONB,
    "receipt_url" TEXT,
    "proof_image_url" TEXT,
    "notes" TEXT,
    "processed_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "active_promotions" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "active_promotions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "reason" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

CREATE INDEX "users_is_blocked_idx" ON "users"("is_blocked");

CREATE INDEX "users_trust_level_idx" ON "users"("trust_level");

CREATE UNIQUE INDEX "merchant_profiles_user_id_key" ON "merchant_profiles"("user_id");

CREATE INDEX "reviews_reviewed_user_id_idx" ON "reviews"("reviewed_user_id");

CREATE UNIQUE INDEX "reviews_reviewer_id_reviewed_user_id_key" ON "reviews"("reviewer_id", "reviewed_user_id");

CREATE INDEX "user_blocks_blocker_id_idx" ON "user_blocks"("blocker_id");

CREATE INDEX "user_blocks_blocked_id_idx" ON "user_blocks"("blocked_id");

CREATE UNIQUE INDEX "user_blocks_blocker_id_blocked_id_key" ON "user_blocks"("blocker_id", "blocked_id");

CREATE UNIQUE INDEX "login_sessions_jti_key" ON "login_sessions"("jti");

CREATE INDEX "login_sessions_user_id_revoked_at_idx" ON "login_sessions"("user_id", "revoked_at");

CREATE INDEX "login_sessions_jti_idx" ON "login_sessions"("jti");

CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

CREATE INDEX "categories_parent_id_order_idx" ON "categories"("parent_id", "order");

CREATE INDEX "categories_is_active_idx" ON "categories"("is_active");

CREATE INDEX "listings_status_city_category_id_bumped_at_idx" ON "listings"("status", "city", "category_id", "bumped_at" DESC);

CREATE INDEX "listings_moderation_status_created_at_idx" ON "listings"("moderation_status", "created_at" DESC);

CREATE INDEX "listings_user_id_created_at_idx" ON "listings"("user_id", "created_at" DESC);

CREATE INDEX "listings_city_category_id_price_idx" ON "listings"("city", "category_id", "price");

CREATE INDEX "listings_deleted_at_idx" ON "listings"("deleted_at");

CREATE INDEX "listings_latitude_longitude_status_idx" ON "listings"("latitude", "longitude", "status");

CREATE INDEX "listings_category_id_price_status_idx" ON "listings"("category_id", "price", "status");

CREATE INDEX "listings_is_featured_created_at_idx" ON "listings"("is_featured", "created_at" DESC);

CREATE INDEX "listings_promotion_type_promotion_expires_at_idx" ON "listings"("promotion_type", "promotion_expires_at");

CREATE INDEX "listings_promotion_order_bumped_at_idx" ON "listings"("promotion_order" DESC, "bumped_at" DESC);

CREATE INDEX "images_listing_id_order_idx" ON "images"("listing_id", "order");

CREATE INDEX "images_hash_idx" ON "images"("hash");

CREATE INDEX "favorites_user_id_created_at_idx" ON "favorites"("user_id", "created_at" DESC);

CREATE INDEX "chats_user_a_id_last_message_at_idx" ON "chats"("user_a_id", "last_message_at" DESC);

CREATE INDEX "chats_user_b_id_last_message_at_idx" ON "chats"("user_b_id", "last_message_at" DESC);

CREATE INDEX "chats_listing_id_idx" ON "chats"("listing_id");

CREATE UNIQUE INDEX "chats_user_a_id_user_b_id_listing_id_key" ON "chats"("user_a_id", "user_b_id", "listing_id");

CREATE INDEX "messages_chat_id_created_at_idx" ON "messages"("chat_id", "created_at" DESC);

CREATE INDEX "messages_deleted_at_idx" ON "messages"("deleted_at");

CREATE INDEX "messages_chat_id_sender_id_created_at_idx" ON "messages"("chat_id", "sender_id", "created_at");

CREATE INDEX "reports_listing_id_idx" ON "reports"("listing_id");

CREATE INDEX "reports_reported_user_id_idx" ON "reports"("reported_user_id");

CREATE UNIQUE INDEX "reports_reporter_id_listing_id_key" ON "reports"("reporter_id", "listing_id");

CREATE UNIQUE INDEX "reports_reporter_id_reported_user_id_key" ON "reports"("reporter_id", "reported_user_id");

CREATE INDEX "moderation_logs_listing_id_idx" ON "moderation_logs"("listing_id");

CREATE INDEX "moderation_logs_user_id_idx" ON "moderation_logs"("user_id");

CREATE INDEX "moderation_logs_created_at_idx" ON "moderation_logs"("created_at" DESC);

CREATE INDEX "moderation_logs_source_idx" ON "moderation_logs"("source");

CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets"("user_id");

CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

CREATE INDEX "support_tickets_city_idx" ON "support_tickets"("city");

CREATE INDEX "ticket_messages_ticket_id_created_at_idx" ON "ticket_messages"("ticket_id", "created_at" ASC);

CREATE INDEX "ticket_attachments_ticket_id_idx" ON "ticket_attachments"("ticket_id");

CREATE INDEX "purchases_user_id_created_at_idx" ON "purchases"("user_id", "created_at" DESC);

CREATE UNIQUE INDEX "purchases_user_id_listing_id_key" ON "purchases"("user_id", "listing_id");

CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at" DESC);

CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at" DESC);

CREATE INDEX "saved_searches_user_id_idx" ON "saved_searches"("user_id");

CREATE INDEX "promotion_products_is_active_type_idx" ON "promotion_products"("is_active", "type");

CREATE UNIQUE INDEX "promotion_products_type_duration_days_key" ON "promotion_products"("type", "duration_days");

CREATE INDEX "transactions_user_id_created_at_idx" ON "transactions"("user_id", "created_at" DESC);

CREATE INDEX "transactions_status_idx" ON "transactions"("status");

CREATE INDEX "transactions_payment_method_status_idx" ON "transactions"("payment_method", "status");

CREATE INDEX "transactions_gateway_ref_idx" ON "transactions"("gateway_ref");

CREATE UNIQUE INDEX "active_promotions_transaction_id_key" ON "active_promotions"("transaction_id");

CREATE INDEX "active_promotions_listing_id_is_active_idx" ON "active_promotions"("listing_id", "is_active");

CREATE INDEX "active_promotions_expires_at_is_active_idx" ON "active_promotions"("expires_at", "is_active");

CREATE INDEX "active_promotions_type_is_active_idx" ON "active_promotions"("type", "is_active");

CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

CREATE INDEX "audit_logs_actor_idx" ON "audit_logs"("actor");

CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

ALTER TABLE "merchant_profiles" ADD CONSTRAINT "merchant_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewed_user_id_fkey" FOREIGN KEY ("reviewed_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "login_sessions" ADD CONSTRAINT "login_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "listings" ADD CONSTRAINT "listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "listings" ADD CONSTRAINT "listings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "images" ADD CONSTRAINT "images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favorites" ADD CONSTRAINT "favorites_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chats" ADD CONSTRAINT "chats_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chats" ADD CONSTRAINT "chats_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chats" ADD CONSTRAINT "chats_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reports" ADD CONSTRAINT "reports_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "ticket_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchases" ADD CONSTRAINT "purchases_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "promotion_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "active_promotions" ADD CONSTRAINT "active_promotions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "active_promotions" ADD CONSTRAINT "active_promotions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

