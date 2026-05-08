import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  CandidateActivityType,
  CandidateEducationStatus,
  CandidateEducationType,
  CandidateLanguageLevel,
  CandidateLanguageType,
  CandidatePreferredJobRole,
  AuthProvider,
  CandidateProgramDuration,
  CandidateProgramStartOption,
  CandidateVisaType,
  MemberRole,
  PartnerIndustry,
  PrismaClient
} from "@prisma/client";

type Json = Record<string, unknown>;

const prisma = new PrismaClient();

const API_BASE = process.env.PARTICIPANTS_API_URL ?? "https://admin.flip-ers.com/api/participants";
const TOKEN = process.env.PARTICIPANTS_TOKEN ?? "";
const PARTICIPANT_ID = process.env.PARTICIPANT_ID ?? "";
const IMPORT_ALL = (process.env.PARTICIPANTS_IMPORT_ALL ?? "0") === "1";
const PAGE_SIZE = Number(process.env.PARTICIPANTS_PAGE_SIZE ?? 50);
const DEFAULT_PASSWORD = process.env.PARTICIPANTS_DEFAULT_PASSWORD ?? "Temp!ChangeMe123";

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asBooleanOrNull(value: unknown): boolean | null {
  if (value === true) return true;
  if (value === false) return false;
  return null;
}

function asDateOrNull(value: unknown): Date | null {
  const text = asString(value);
  if (!text) return null;
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function mapGender(value: string | null) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "male" || normalized === "m") return "male";
  if (normalized === "female" || normalized === "f") return "female";
  return normalized;
}

function mapVisaType(value: string | null): CandidateVisaType | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "").replace("_", "-");
  const map: Record<string, CandidateVisaType> = {
    "D-10": CandidateVisaType.D10_JOB_SEEKING,
    "D-2": CandidateVisaType.D2_STUDENT,
    "D-4": CandidateVisaType.D4_GENERAL_TRAINING,
    "F-2": CandidateVisaType.F2_RESIDENCE,
    "F-4": CandidateVisaType.F4_OVERSEAS_KOREAN,
    "F-5": CandidateVisaType.F5_PERMANENT_RESIDENCE,
    "F-6": CandidateVisaType.F6_MARRIAGE_IMMIGRATION,
    "E-7": CandidateVisaType.E7_SPECIFIC_ACTIVITY,
    "H-1": CandidateVisaType.H1_WORKING_HOLIDAY
  };
  return map[normalized] ?? CandidateVisaType.OTHER;
}

function mapProgramDuration(value: string | null): CandidateProgramDuration | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("6")) return CandidateProgramDuration.WEEKS_6;
  if (normalized.includes("8")) return CandidateProgramDuration.WEEKS_8;
  if (normalized.includes("10")) return CandidateProgramDuration.WEEKS_10;
  if (normalized.includes("12")) return CandidateProgramDuration.WEEKS_12;
  if (normalized.includes("14")) return CandidateProgramDuration.WEEKS_14;
  if (normalized.includes("16")) return CandidateProgramDuration.WEEKS_16;
  if (normalized.includes("flex") || normalized.includes("협의")) return CandidateProgramDuration.NEGOTIABLE;
  return null;
}

function mapProgramStartOption(value: string | null): CandidateProgramStartOption | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("asap") || normalized.includes("빠")) return CandidateProgramStartOption.ASAP;
  return CandidateProgramStartOption.SPECIFIC_DATE;
}

function mapLanguage(value: string | null): CandidateLanguageType | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  const map: Record<string, CandidateLanguageType> = {
    KOREAN: CandidateLanguageType.KOREAN,
    ENGLISH: CandidateLanguageType.ENGLISH,
    CHINESE: CandidateLanguageType.CHINESE,
    JAPANESE: CandidateLanguageType.JAPANESE,
    VIETNAMESE: CandidateLanguageType.VIETNAMESE,
    INDONESIAN: CandidateLanguageType.INDONESIAN,
    THAI: CandidateLanguageType.THAI,
    MALAY: CandidateLanguageType.MALAY,
    FILIPINO: CandidateLanguageType.FILIPINO,
    HINDI: CandidateLanguageType.HINDI,
    SPANISH: CandidateLanguageType.SPANISH,
    FRENCH: CandidateLanguageType.FRENCH,
    GERMAN: CandidateLanguageType.GERMAN
  };
  return map[normalized] ?? CandidateLanguageType.OTHER;
}

function mapLanguageLevel(value: string | null): CandidateLanguageLevel {
  const normalized = (value ?? "").trim().toUpperCase();
  if (normalized === "NATIVE") return CandidateLanguageLevel.NATIVE;
  if (normalized === "ADVANCED") return CandidateLanguageLevel.ADVANCED;
  if (normalized === "INTERMEDIATE") return CandidateLanguageLevel.INTERMEDIATE;
  return CandidateLanguageLevel.BEGINNER;
}

function mapEducationType(value: string | null): CandidateEducationType {
  const normalized = (value ?? "").trim().toUpperCase();
  const map: Record<string, CandidateEducationType> = {
    HIGH_SCHOOL: CandidateEducationType.HIGH_SCHOOL,
    ASSOCIATE: CandidateEducationType.ASSOCIATE,
    BACHELOR: CandidateEducationType.BACHELOR,
    MASTER: CandidateEducationType.MASTER,
    DOCTOR: CandidateEducationType.DOCTOR,
    BOOTCAMP: CandidateEducationType.BOOTCAMP,
    CERTIFICATE: CandidateEducationType.CERTIFICATE
  };
  return map[normalized] ?? CandidateEducationType.OTHER;
}

function mapEducationStatus(value: string | null): CandidateEducationStatus {
  const normalized = (value ?? "").trim().toUpperCase();
  if (normalized === "IN_PROGRESS" || normalized === "ENROLLED") return CandidateEducationStatus.ENROLLED;
  if (normalized === "COMPLETED" || normalized === "GRADUATED") return CandidateEducationStatus.GRADUATED;
  if (normalized.includes("LEAVE")) return CandidateEducationStatus.LEAVE_OF_ABSENCE;
  if (normalized.includes("DROP")) return CandidateEducationStatus.DROPPED_OUT;
  return CandidateEducationStatus.OTHER;
}

function mapActivityType(value: string | null): CandidateActivityType {
  const normalized = (value ?? "").trim().toUpperCase();
  const map: Record<string, CandidateActivityType> = {
    PROJECT: CandidateActivityType.PROJECT,
    VOLUNTEER: CandidateActivityType.VOLUNTEER,
    INTERNSHIP: CandidateActivityType.INTERNSHIP,
    CERTIFICATE: CandidateActivityType.CERTIFICATE,
    AWARD: CandidateActivityType.AWARD,
    EXTRACURRICULAR: CandidateActivityType.EXTRACURRICULAR
  };
  return map[normalized] ?? CandidateActivityType.OTHER;
}

function mapPreferredJob(value: string | null): CandidatePreferredJobRole | null {
  const normalized = (value ?? "").trim().toUpperCase();
  const map: Record<string, CandidatePreferredJobRole> = {
    SOFTWARE_DEVELOPMENT: CandidatePreferredJobRole.SOFTWARE_DEVELOPMENT,
    FRONTEND_DEVELOPMENT: CandidatePreferredJobRole.FRONTEND_DEVELOPMENT,
    BACKEND_DEVELOPMENT: CandidatePreferredJobRole.BACKEND_DEVELOPMENT,
    DATA_ANALYST: CandidatePreferredJobRole.DATA_ANALYSIS_SCIENCE,
    DATA_ANALYSIS_SCIENCE: CandidatePreferredJobRole.DATA_ANALYSIS_SCIENCE,
    UI_UX_DESIGN: CandidatePreferredJobRole.UI_UX_DESIGN,
    PRODUCT_MANAGER: CandidatePreferredJobRole.PRODUCT_MANAGER,
    MARKETING: CandidatePreferredJobRole.MARKETING,
    SALES: CandidatePreferredJobRole.SALES,
    HR: CandidatePreferredJobRole.HR,
    FINANCE_ACCOUNTING: CandidatePreferredJobRole.FINANCE_ACCOUNTING,
    OPERATIONS_PLANNING: CandidatePreferredJobRole.OPERATIONS_PLANNING,
    JOB_OTHER: CandidatePreferredJobRole.OTHER
  };
  return map[normalized] ?? null;
}

function mapPreferredIndustry(value: string | null): PartnerIndustry | null {
  const normalized = (value ?? "").trim().toUpperCase();
  const map: Record<string, PartnerIndustry> = {
    BEAUTY: PartnerIndustry.BEAUTY,
    HEALTHCARE: PartnerIndustry.WELLNESS,
    ENERGY: PartnerIndustry.CONSULTING,
    IT: PartnerIndustry.IT,
    AI: PartnerIndustry.AI,
    INDUSTRY_OTHER: PartnerIndustry.STARTUP
  };
  return map[normalized] ?? null;
}

async function fetchParticipantDetail(id: string) {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`participant fetch failed (${response.status}): ${text.slice(0, 300)}`);
  }
  return (await response.json()) as Json;
}

async function fetchParticipantIds(): Promise<string[]> {
  const ids: string[] = [];
  let page = 1;
  while (true) {
    const url = new URL(API_BASE);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(PAGE_SIZE));
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`participants list fetch failed (${response.status}): ${text.slice(0, 300)}`);
    }
    const payload = (await response.json()) as Json;
    const data = asArray(payload.data);
    if (data.length === 0) break;
    data.forEach((item) => {
      const idValue = (item as Json).id;
      if (typeof idValue === "number" && Number.isFinite(idValue)) ids.push(String(Math.trunc(idValue)));
      else if (typeof idValue === "string" && idValue.trim()) ids.push(idValue.trim());
    });
    const total = typeof payload.total === "number" ? payload.total : null;
    if (total !== null && ids.length >= total) break;
    if (data.length < PAGE_SIZE) break;
    page += 1;
  }
  return ids;
}

async function importOneParticipant(participantId: string, passwordHash: string) {
  const detail = await fetchParticipantDetail(participantId);
  const userRaw = (detail.user ?? null) as Json | null;
  const email = asString(userRaw?.email);
  if (!email) throw new Error(`participant ${participantId}: user email is missing`);

  const user = await prisma.user.upsert({
    where: { email_authProvider: { email: email.toLowerCase(), authProvider: AuthProvider.EMAIL } },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      role: MemberRole.STUDENT,
      emailVerified: Boolean(userRaw?.emailVerified),
      name: asString(userRaw?.name) ?? asString(detail.fullName),
      phoneNumber: asString(detail.phone),
      nationality: asString(detail.nationality),
      birthDate: asDateOrNull(detail.birthDate),
      gender: mapGender(asString(detail.gender)),
      jobTitle: asString(detail.desiredPosition)
    },
    update: {
      role: MemberRole.STUDENT,
      emailVerified: Boolean(userRaw?.emailVerified),
      name: asString(userRaw?.name) ?? asString(detail.fullName),
      phoneNumber: asString(detail.phone),
      nationality: asString(detail.nationality),
      birthDate: asDateOrNull(detail.birthDate),
      gender: mapGender(asString(detail.gender)),
      jobTitle: asString(detail.desiredPosition)
    }
  });

  const preferredJobRoles = asArray(detail.preferredJobs)
    .map((item) => mapPreferredJob(asString((item as Json).job)))
    .filter((item): item is CandidatePreferredJobRole => Boolean(item));
  const preferredIndustries = asArray(detail.preferredIndustries)
    .map((item) => mapPreferredIndustry(asString((item as Json).industry)))
    .filter((item): item is PartnerIndustry => Boolean(item));

  const startYear = typeof detail.programStartYear === "number" ? detail.programStartYear : null;
  const startMonth = typeof detail.programStartMonth === "number" ? detail.programStartMonth : null;
  const startDate =
    startYear && startMonth && startMonth >= 1 && startMonth <= 12
      ? new Date(Date.UTC(startYear, startMonth - 1, 1))
      : null;

  const profile = await prisma.candidateProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      workPermit: asBooleanOrNull(detail.hasWorkPermit),
      visaType: mapVisaType(asString(detail.visaType)),
      visaExpiryDate: asDateOrNull(detail.visaExpiry),
      livesInKorea: asBooleanOrNull(detail.isInKorea),
      hasAccommodation: asBooleanOrNull(detail.hasPlannedAccommodation),
      residenceProvince: asString(detail.residenceCity),
      residenceDistrict: asString(detail.residenceDistrict),
      residenceAddress: asString(detail.residenceDetail),
      preferredProgramDuration: mapProgramDuration(asString(detail.preferredDuration)),
      programStartOption: mapProgramStartOption(asString(detail.programStartTiming)),
      programStartDate: startDate,
      preferredIndustries,
      preferredJobRoles,
      skills: asString(detail.skills)
        ? asString(detail.skills)!
            .split(/[,\n/|]+/g)
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      selfIntroduction: asString(detail.selfIntroduction),
      programMotivation: asString(detail.programMotivation),
      emergencyContactAddress: asString(detail.emergencyGuardianAddress),
      emergencyContactName: asString(detail.emergencyGuardianName),
      emergencyContactPhone: asString(detail.emergencyGuardianPhone),
      emergencyContactEmail: asString(detail.emergencyGuardianEmail),
      residenceAddress: asString(detail.residenceDetail)
    },
    update: {
      workPermit: asBooleanOrNull(detail.hasWorkPermit),
      visaType: mapVisaType(asString(detail.visaType)),
      visaExpiryDate: asDateOrNull(detail.visaExpiry),
      livesInKorea: asBooleanOrNull(detail.isInKorea),
      hasAccommodation: asBooleanOrNull(detail.hasPlannedAccommodation),
      residenceProvince: asString(detail.residenceCity),
      residenceDistrict: asString(detail.residenceDistrict),
      residenceAddress: asString(detail.residenceDetail),
      preferredProgramDuration: mapProgramDuration(asString(detail.preferredDuration)),
      programStartOption: mapProgramStartOption(asString(detail.programStartTiming)),
      programStartDate: startDate,
      preferredIndustries,
      preferredJobRoles,
      skills: asString(detail.skills)
        ? asString(detail.skills)!
            .split(/[,\n/|]+/g)
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      selfIntroduction: asString(detail.selfIntroduction),
      programMotivation: asString(detail.programMotivation),
      emergencyContactAddress: asString(detail.emergencyGuardianAddress),
      emergencyContactName: asString(detail.emergencyGuardianName),
      emergencyContactPhone: asString(detail.emergencyGuardianPhone),
      emergencyContactEmail: asString(detail.emergencyGuardianEmail)
    }
  });

  await prisma.$transaction([
    prisma.candidateEducation.deleteMany({ where: { candidateProfileId: profile.id } }),
    prisma.candidateLanguageSkill.deleteMany({ where: { candidateProfileId: profile.id } }),
    prisma.candidateCareer.deleteMany({ where: { candidateProfileId: profile.id } }),
    prisma.candidateActivityExperience.deleteMany({ where: { candidateProfileId: profile.id } })
  ]);

  const educations = asArray(detail.educations).map((item) => item as Json);
  const languages = asArray(detail.languages).map((item) => item as Json);
  const careers = asArray(detail.careers).map((item) => item as Json);
  const experiences = asArray(detail.experiences).map((item) => item as Json);

  if (educations.length > 0) {
    await prisma.candidateEducation.createMany({
      data: educations.map((edu) => ({
        candidateProfileId: profile.id,
        schoolName: asString(edu.schoolName) ?? "-",
        educationType: mapEducationType(asString(edu.type)),
        major: asString(edu.major),
        status: mapEducationStatus(asString(edu.status)),
        country: asString(edu.country),
        city: asString(edu.city),
        startDate: asDateOrNull(edu.startDate),
        endDate: asDateOrNull(edu.endDate),
        isKoreanSchool: typeof edu.isKorean === "boolean" ? (edu.isKorean as boolean) : null
      }))
    });
  }

  if (languages.length > 0) {
    await prisma.candidateLanguageSkill.createMany({
      data: languages.map((lang) => ({
        candidateProfileId: profile.id,
        language: mapLanguage(asString(lang.language)) ?? CandidateLanguageType.OTHER,
        level: mapLanguageLevel(asString(lang.level)),
        testName: asString(lang.testName),
        score: asString(lang.testScore)
      }))
    });
  }

  if (careers.length > 0) {
    await prisma.candidateCareer.createMany({
      data: careers.map((career) => ({
        candidateProfileId: profile.id,
        companyName: asString(career.company) ?? "-",
        position: asString(career.position) ?? "-",
        department: asString(career.department),
        isCurrent: Boolean(career.isCurrent),
        startDate: asDateOrNull(career.startDate),
        endDate: asDateOrNull(career.endDate),
        description: asArray(career.descriptions)
          .map((d) => asString(d))
          .filter((d): d is string => Boolean(d))
          .join("\n")
      }))
    });
  }

  if (experiences.length > 0) {
    await prisma.candidateActivityExperience.createMany({
      data: experiences.map((exp) => ({
        candidateProfileId: profile.id,
        activityType: mapActivityType(asString(exp.type)),
        title: asString(exp.title) ?? "-",
        organization: asString(exp.organization),
        startDate: asDateOrNull(exp.startDate),
        endDate: asDateOrNull(exp.endDate),
        description: asArray(exp.descriptions)
          .map((d) => asString(d))
          .filter((d): d is string => Boolean(d))
          .join("\n"),
        skills: asArray(exp.skills)
          .map((s) => asString(s))
          .filter((s): s is string => Boolean(s))
      }))
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        participantId,
        userId: user.id,
        email: user.email,
        imported: {
          educations: educations.length,
          languages: languages.length,
          careers: careers.length,
          experiences: experiences.length
        }
      },
      null,
      2
    )
  );
}

async function run() {
  if (!TOKEN) throw new Error("PARTICIPANTS_TOKEN is required");
  if (!IMPORT_ALL && !PARTICIPANT_ID) throw new Error("PARTICIPANT_ID is required (or set PARTICIPANTS_IMPORT_ALL=1)");

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const targets = IMPORT_ALL ? await fetchParticipantIds() : [PARTICIPANT_ID];

  let success = 0;
  let failed = 0;
  const failedIds: string[] = [];
  for (const id of targets) {
    try {
      await importOneParticipant(id, passwordHash);
      success += 1;
    } catch (error) {
      failed += 1;
      failedIds.push(id);
      console.error(`[participant-import] failed id=${id}:`, error);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: failed === 0,
        importAll: IMPORT_ALL,
        totalTargets: targets.length,
        success,
        failed,
        failedIds
      },
      null,
      2
    )
  );
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
