export function getUserSlug(user: any): string {
  if (!user) return "user";
  const name = user.profile?.full_name?.trim() || user.email?.split("@")[0] || "user";
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
}

export function getRoleFromUserOrToken(userObj?: any): string | null {
  if (userObj?.role?.name) {
    return userObj.role.name.toLowerCase();
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("samidha_access_token");
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.role) {
            return payload.role.toLowerCase();
          }
        }
      } catch {}
    }
  }
  return null;
}

export function getUserHomeLink(user: any): string {
  if (!user) return "/";
  const slug = getUserSlug(user);
  const roleName = getRoleFromUserOrToken(user) || (user.role?.name ? user.role.name.toLowerCase() : "student");
  if (roleName === "volunteer") return `/volunteer/${slug}`;
  if (roleName === "alumni") return `/alumni/${slug}`;
  if (roleName === "super_admin" || roleName === "admin") return `/admin`;
  return `/dashboard/${slug}`;
}
