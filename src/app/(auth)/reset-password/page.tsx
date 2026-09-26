import { AuthForm } from "../auth-form";

export default async function ResetPasswordPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ token?: string }> }>) {
  const { token } = await searchParams;
  return <AuthForm mode="reset" token={token} />;
}
