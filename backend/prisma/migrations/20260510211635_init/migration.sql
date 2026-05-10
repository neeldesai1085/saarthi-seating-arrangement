/*
  Warnings:

  - You are about to drop the column `benchCapacity` on the `Room` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Room" DROP COLUMN "benchCapacity",
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
