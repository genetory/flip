import { createHash } from "node:crypto";
import { PositionSourceKind, PositionSourceProvider, PositionStatus, PrismaClient } from "@prisma/client";
import { embedAndSavePosition } from "../../src/embedding/position-embedding";

export type NormalizedExternalPosition = {
  externalId: string;
  title: string;
  sourceUrl: string;
  sourceProvider: PositionSourceProvider;
  postedAt?: Date | null;
  status?: PositionStatus;
  workLocation?: string | null;
  workType?: string | null;
  employmentType?: string | null;
  preferredJobRole?: string | null;
  thumbnailImages?: string[];
  communicationLanguages?: string[];
  eligibleVisas?: string[];
  additionalNotes?: string | null;
  sourceDeadlineDate?: Date | null;
  // 상세 JD(있으면) — 내부(CIP) 공고와 동일한 상세 페이지를 채우기 위한 필드.
  mainResponsibilities?: string | null;
  requiredQualifications?: string | null;
  preferredQualifications?: string | null;
  hiringProcess?: string | null;
};

const HASH_MARKER = "[[sourceSyncHash:";

function extractHashFromNotes(notes: string | null): string | null {
  if (!notes) return null;
  const markerStart = notes.indexOf(HASH_MARKER);
  if (markerStart < 0) return null;
  const markerEnd = notes.indexOf("]]", markerStart);
  if (markerEnd < 0) return null;
  return notes.slice(markerStart + HASH_MARKER.length, markerEnd).trim() || null;
}

function makeHash(payload: unknown): string {
  return createHash("sha1").update(JSON.stringify(payload)).digest("hex");
}

function uniqueTrimmed(values: string[] | undefined): string[] {
  if (!values) return [];
  return Array.from(new Set(values.map((v) => v.trim()).filter((v) => v.length > 0)));
}

export async function upsertExternalPositions(prisma: PrismaClient, providerName: string, rows: NormalizedExternalPosition[]) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const communicationLanguages = uniqueTrimmed(row.communicationLanguages);
    const eligibleVisas = uniqueTrimmed(row.eligibleVisas);
    const thumbnailImages = uniqueTrimmed(row.thumbnailImages).slice(0, 5);
    const status = row.status ?? PositionStatus.OPEN;

    const syncHash = makeHash({
      title: row.title,
      postedAt: row.postedAt ? row.postedAt.toISOString() : null,
      status,
      sourceUrl: row.sourceUrl,
      workLocation: row.workLocation ?? null,
      workType: row.workType ?? null,
      preferredJobRole: row.preferredJobRole ?? null,
      thumbnailImages,
      communicationLanguages,
      eligibleVisas,
      additionalNotes: row.additionalNotes ?? null,
      sourceDeadlineDate: row.sourceDeadlineDate ? row.sourceDeadlineDate.toISOString() : null,
      mainResponsibilities: row.mainResponsibilities ?? null,
      requiredQualifications: row.requiredQualifications ?? null,
      preferredQualifications: row.preferredQualifications ?? null,
      hiringProcess: row.hiringProcess ?? null
    });

    const additionalNotes = [
      `[[externalSourceProvider:${row.sourceProvider}]]`,
      `[[externalSourceId:${row.externalId}]]`,
      `${HASH_MARKER}${syncHash}]]`,
      `Imported by ${providerName}`,
      row.additionalNotes ?? null
    ]
      .filter((line): line is string => Boolean(line && line.trim().length > 0))
      .join("\n");

    const existing = await prisma.position.findUnique({
      where: {
        sourceProvider_sourceExternalId: {
          sourceProvider: row.sourceProvider,
          sourceExternalId: row.externalId
        }
      },
      select: { id: true, additionalNotes: true }
    });

    if (existing && extractHashFromNotes(existing.additionalNotes) === syncHash) {
      skipped += 1;
      continue;
    }

    let positionId: string;
    if (existing) {
      await prisma.position.update({
        where: { id: existing.id },
        data: {
          sourceKind: PositionSourceKind.EXTERNAL,
          sourceProvider: row.sourceProvider,
          sourceExternalId: row.externalId,
          sourceUrl: row.sourceUrl,
          sourceFetchedAt: new Date(),
          sourceDeadlineDate: row.sourceDeadlineDate ?? null,
          ...(row.postedAt ? { createdAt: row.postedAt } : {}),
          title: row.title,
          status,
          workLocation: row.workLocation ?? null,
          workType: row.workType ?? null,
          preferredJobRole: row.preferredJobRole ?? null,
          thumbnailImages,
          communicationLanguages,
          eligibleVisas,
          additionalNotes,
          mainResponsibilities: row.mainResponsibilities ?? null,
          requiredQualifications: row.requiredQualifications ?? null,
          preferredQualifications: row.preferredQualifications ?? null,
          hiringProcess: row.hiringProcess ?? null
        }
      });
      positionId = existing.id;
      updated += 1;
    } else {
      const createdRow = await prisma.position.create({
        data: {
          sourceKind: PositionSourceKind.EXTERNAL,
          sourceProvider: row.sourceProvider,
          sourceExternalId: row.externalId,
          sourceUrl: row.sourceUrl,
          sourceFetchedAt: new Date(),
          sourceDeadlineDate: row.sourceDeadlineDate ?? null,
          ...(row.postedAt ? { createdAt: row.postedAt } : {}),
          title: row.title,
          status,
          workLocation: row.workLocation ?? null,
          workType: row.workType ?? null,
          preferredJobRole: row.preferredJobRole ?? null,
          thumbnailImages,
          communicationLanguages,
          eligibleVisas,
          additionalNotes,
          mainResponsibilities: row.mainResponsibilities ?? null,
          requiredQualifications: row.requiredQualifications ?? null,
          preferredQualifications: row.preferredQualifications ?? null,
          hiringProcess: row.hiringProcess ?? null
        },
        select: { id: true }
      });
      positionId = createdRow.id;
      created += 1;
    }

    // Importers run as batch scripts where API rate-limit headroom matters
    // less than search quality, so we await the embedding write here
    // instead of fire-and-forget.
    await embedAndSavePosition(prisma, positionId);
  }

  return { created, updated, skipped, total: rows.length };
}
