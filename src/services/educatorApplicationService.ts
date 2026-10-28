import { api } from "./api";

export type EducatorApplicationPayload = {
  fullName: string; email: string; phone: string; institution: string; city: string;
  education: "SMA/SMK" | "D3" | "S1" | "S2" | "S3" | "Pesantren/Nonformal" | "Lainnya";
  subjects: string[]; experience: "Belum berpengalaman" | "Kurang dari 1 tahun" | "1–3 tahun" | "Lebih dari 3 tahun";
  motivation: string; evidenceUrl?: string; verificationConsent: true;
};
export type EducatorSubmissionResult = {
  applicationId: string; status: "PENDING" | "APPROVED"; simulation: boolean;
  credentials?: { username: string; password: string };
};
export type EducatorApplicationItem = EducatorApplicationPayload & {
  id: string; status: "PENDING" | "APPROVED" | "REJECTED"; username: string | null;
  reviewNote: string | null; createdAt: string | null; reviewedAt: string | null;
};
export const submitEducatorApplication = (payload: EducatorApplicationPayload) =>
  api.post<EducatorSubmissionResult>("/educator-applications", payload);
export const listEducatorApplications = () =>
  api.get<{ items: EducatorApplicationItem[] }>("/educator-applications");
export const decideEducatorApplication = (id: string, decision: "APPROVE" | "REJECT", note?: string) =>
  api.patch<{ status: "APPROVED" | "REJECTED"; credentials?: { username: string; password: string } }>(
    `/educator-applications/${id}`, { decision, note }
  );
