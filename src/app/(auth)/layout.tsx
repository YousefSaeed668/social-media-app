import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();
  // if user is logged in, redirect to home page
  // and the children will not be rendered
  if (user) redirect("/");
  return <>{children}</>;
}
