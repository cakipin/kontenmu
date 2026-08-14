CREATE TABLE IF NOT EXISTS "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"sekolah_id" integer NOT NULL,
	"message" text NOT NULL,
	"is_read" integer DEFAULT 0,
	"created_at" text DEFAULT CURRENT_TIMESTAMP
);
