export interface MetaSchema {
  page?: number;
  limit?: number;
  total_items?: number;
  total_pages?: number;
  has_next?: boolean;
}

export interface ErrorDetail {
  field?: string;
  message: string;
}

export interface StandardResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: MetaSchema;
  errors?: ErrorDetail[];
}

export type UserRole = "student" | "volunteer" | "alumni" | "admin" | "super_admin";

export interface UserProfile {
  id: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  role: {
    id: string;
    name: UserRole;
    description?: string;
  };
  profile?: {
    full_name: string;
    avatar_url?: string;
    bio?: string;
    phone?: string;
  };
  learner_profile?: {
    institution_type?: string;
    institution_name?: string;
    class_or_degree?: string;
    interests?: string[];
  };
  volunteer_profile?: {
    organization?: string;
    expertise_areas?: string[];
    volunteer_hours?: number;
    is_approved?: boolean;
    approval_status?: string;
    applied_at?: string;
    expires_at?: string;
    rejection_reason?: string;
  };
  alumni_profile?: {
    graduation_year?: number;
    current_company?: string;
    designation?: string;
    mentorship_offered?: boolean;
  };
}

export interface ResourceItem {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  external_url: string;
  views_count: number;
  bookmarks_count: number;
  is_bookmarked?: boolean;
  created_at: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  poster_url?: string;
  venue: string;
  event_date: string;
  registrations_count: number;
}

export interface CommunityPostItem {
  id: string;
  title: string;
  content: string;
  post_type: "general" | "mentorship" | "career_guidance" | "article";
  likes_count: number;
  comments_count: number;
  author_id: string;
  author_name?: string;
  author_avatar?: string | null;
  author_role?: string;
  created_at: string;
}
