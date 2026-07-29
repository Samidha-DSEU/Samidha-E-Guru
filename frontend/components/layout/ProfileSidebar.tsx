import React, { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { X, Save, User, Camera, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
  const { user, updateProfile, logout } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    profile: {
      full_name: "",
      avatar_url: "",
      bio: "",
      phone: ""
    },
    learner_profile: {
      institution_name: "",
      class_or_degree: ""
    },
    volunteer_profile: {
      organization: ""
    },
    alumni_profile: {
      current_company: "",
      designation: ""
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        profile: {
          full_name: user.profile?.full_name || "",
          avatar_url: user.profile?.avatar_url || "",
          bio: user.profile?.bio || "",
          phone: user.profile?.phone || ""
        },
        learner_profile: {
          institution_name: user.learner_profile?.institution_name || "",
          class_or_degree: user.learner_profile?.class_or_degree || ""
        },
        volunteer_profile: {
          organization: user.volunteer_profile?.organization || ""
        },
        alumni_profile: {
          current_company: user.alumni_profile?.current_company || "",
          designation: user.alumni_profile?.designation || ""
        }
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profile: { ...prev.profile, avatar_url: reader.result as string }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      profile: { ...formData.profile, [e.target.name]: e.target.value }
    });
  };

  const handleRoleChange = (roleKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [roleKey]: { ...((formData as any)[roleKey]), [e.target.name]: e.target.value }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity" 
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 z-[70] shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Your Profile</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <div className="h-24 w-24 rounded-full bg-sky-100 dark:bg-sky-950/50 flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-lg overflow-hidden">
                {formData.profile.avatar_url ? (
                  <img src={formData.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-sky-500" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-sky-600 text-white rounded-full shadow-md hover:bg-sky-500 transition-colors"
                title="Upload Profile Picture"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">{user?.profile?.full_name}</h3>
              <p className="text-sm text-zinc-500 capitalize">{user?.role?.name?.replace("_", " ")}</p>
            </div>
          </div>

          <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Full Name</label>
              <input
                name="full_name"
                value={formData.profile.full_name}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Phone</label>
              <input
                name="phone"
                value={formData.profile.phone}
                onChange={handleProfileChange}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">About Me</label>
              <textarea
                name="bio"
                value={formData.profile.bio}
                onChange={handleProfileChange}
                rows={3}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            {user?.role?.name === "student" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Institution Name</label>
                  <input
                    name="institution_name"
                    value={formData.learner_profile.institution_name}
                    onChange={(e) => handleRoleChange('learner_profile', e)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Class or Degree</label>
                  <input
                    name="class_or_degree"
                    value={formData.learner_profile.class_or_degree}
                    onChange={(e) => handleRoleChange('learner_profile', e)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </>
            )}

            {user?.role?.name === "volunteer" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Organization</label>
                <input
                  name="organization"
                  value={formData.volunteer_profile.organization}
                  onChange={(e) => handleRoleChange('volunteer_profile', e)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            {user?.role?.name === "alumni" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Current Company</label>
                  <input
                    name="current_company"
                    value={formData.alumni_profile.current_company}
                    onChange={(e) => handleRoleChange('alumni_profile', e)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Designation</label>
                  <input
                    name="designation"
                    value={formData.alumni_profile.designation}
                    onChange={(e) => handleRoleChange('alumni_profile', e)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </>
            )}
          </form>
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between gap-3">
          <Button type="submit" form="profile-form" className="flex-1 bg-sky-600 hover:bg-sky-500 text-white">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 border-rose-200 dark:border-rose-900"
            onClick={() => {
              logout();
              onClose();
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
