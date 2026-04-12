import { auth } from "#app/lib/auth";

export const createOrganization = async (data: { orgName: string; orgIdentifier: string; orgAvatarUrl: string }) => {
  await auth.organization.create({
    name: data.orgName,
    slug: data.orgIdentifier,
  });
  // TODO: Handle orgAvatarUrl
};
