-- AlterTable: add candidate document storage fields (Azure Blob URLs + display
-- file names) for resume, cover letter, portfolio, and passport image.
ALTER TABLE "CandidateProfile"
  ADD COLUMN "resumeUrl" TEXT,
  ADD COLUMN "resumeFileName" TEXT,
  ADD COLUMN "coverLetterUrl" TEXT,
  ADD COLUMN "coverLetterFileName" TEXT,
  ADD COLUMN "portfolioUrl" TEXT,
  ADD COLUMN "portfolioFileName" TEXT,
  ADD COLUMN "passportImageUrl" TEXT,
  ADD COLUMN "passportImageFileName" TEXT;
