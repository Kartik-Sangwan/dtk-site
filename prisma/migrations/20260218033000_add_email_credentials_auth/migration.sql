-- Add password-based auth fields to users
ALTER TABLE "User"
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "emailVerified" TIMESTAMP(3);

-- Verification tokens for email signup
CREATE TABLE "EmailVerificationToken" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE INDEX "EmailVerificationToken_email_idx" ON "EmailVerificationToken"("email");
