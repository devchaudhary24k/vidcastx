import { auth } from "#app/lib/auth";

export const updateUser = async (data: {
  firstName: string;
  lastName: string;
  recoveryEmail: string;
  avatarUrl: string;
}) => {
  await auth.updateUser({
    firstName: data.firstName,
    lastName: data.lastName,
  });
  // TODO: Handle recoveryEmail and avatarUrl
};
