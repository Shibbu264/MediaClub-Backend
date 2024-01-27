/*
  Warnings:

  - A unique constraint covering the columns `[userid]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Admin_password_key";

-- AlterTable
ALTER TABLE "Admin" ALTER COLUMN "updatedat" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userid_key" ON "Admin"("userid");
