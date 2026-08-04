export function getUserSlug(user: any): string {
  if (!user) return "user";
  const name = user.profile?.full_name?.trim() || user.email?.split("@")[0] || "user";
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
}

export function getUserHomeLink(user: any): string {
  if (!user) return "/";
  const slug = getUserSlug(user);
  if (user.role?.name === "volunteer") return `/volunteer/${slug}`;
  if (user.role?.name === "alumni") return `/alumni/${slug}`;
  if (user.role?.name === "super_admin") return `/super-admin/${slug}`;
  if (user.role?.name === "admin") return `/admin/${slug}`;
  return `/dashboard/${slug}`;
}
