import { jobProfileRepository } from "@/repositories/jobProfile.repository";
import type { JobProfile, JobProfileDto } from "@/types/jobProfile";

export const jobProfileService = {
  async listReviewedJobProfiles(): Promise<JobProfileDto[]> {
    const profiles = await jobProfileRepository.findManyReviewed();

    return profiles.map(toJobProfileDto);
  }
};

export function toJobProfileDto(jobProfile: JobProfile): JobProfileDto {
  return {
    ...jobProfile,
    createdAt: jobProfile.createdAt.toISOString(),
    reviewedAt: jobProfile.reviewedAt?.toISOString() ?? null,
    updatedAt: jobProfile.updatedAt.toISOString()
  };
}
