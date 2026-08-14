"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { X, Save, User, Camera, LogOut, Trash2, ShieldAlert, GraduationCap, ShieldCheck, Award, Settings, BookOpen, MessageSquare, BookmarkCheck, Calendar, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { apiClient } from "@/services/apiClient";

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
  const { user, updateProfile, logout } = useAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  const roleName = user?.role?.name || "student";
  const isVolunteerOrAlumniVerified =
    (roleName === "volunteer" || roleName === "alumni") &&
    (user?.volunteer_profile?.approval_status === "APPROVED" || Boolean(user?.alumni_profile));

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
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

  const handleRoleChange = (roleKey: string, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleDeleteAccountConfirm = async () => {
    try {
      setIsDeleting(true);
      await apiClient.delete("/auth/me");
      alert("Your account has been deleted successfully.");
      logout();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.message || "Failed to delete account.");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  return createPortal(
    <>
      {/* FULLSCREEN BACKDROP - MOUNTED DIRECTLY TO BODY TO PREVENT HEADER CLIPPING */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99998] transition-opacity animate-in fade-in" 
        onClick={onClose}
      />

      {/* ULTRA-PREMIUM FULL HEIGHT SLIDE-OVER DRAWER */}
      <aside className="fixed inset-y-0 right-0 top-0 bottom-0 h-screen h-[100dvh] w-full sm:w-[420px] max-w-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 z-[99999] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* SIDEBAR HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Profile & LMS Sidebar</h2>
              <p className="text-[11px] text-zinc-500 font-medium">Manage your portal preferences & account</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SCROLLABLE SIDEBAR BODY */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          
          {/* USER AVATAR & BADGES */}
          <div className="flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="relative group">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <div className="h-20 w-20 rounded-full bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-xl overflow-hidden">
                {formData.profile.avatar_url ? (
                  <img src={formData.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-sky-500" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-sky-600 text-white rounded-full shadow-lg hover:bg-sky-500 transition-colors"
                title="Upload Profile Picture"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">{user?.profile?.full_name || "SAMIDHA Member"}</h3>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-[11px] font-bold rounded-full capitalize">
                {roleName === "student" && <GraduationCap className="h-3.5 w-3.5" />}
                {roleName === "volunteer" && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
                {roleName === "alumni" && <Award className="h-3.5 w-3.5 text-indigo-500" />}
                {roleName === "admin" && <Settings className="h-3.5 w-3.5 text-amber-500" />}
                <span>{roleName.replace("_", " ")} Portal Access</span>
              </div>
            </div>
          </div>

          {/* ROLE-BASED LMS NAVIGATION */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
              {roleName.toUpperCase()} NAVIGATION MENU
            </h4>

            <div className="space-y-1">
              {roleName === "student" && (
                <>
                  <Link href="/dashboard" onClick={onClose} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-900 rounded-xl transition-colors group">
                    <span className="flex items-center gap-2.5"><BookOpen className="h-4 w-4 text-sky-500" /> Student Overview & Progress</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/resources" onClick={onClose} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-900 rounded-xl transition-colors group">
                    <span className="flex items-center gap-2.5"><BookmarkCheck className="h-4 w-4 text-emerald-500" /> Educational Resource Library</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/community" onClick={onClose} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-900 rounded-xl transition-colors group">
                    <span className="flex items-center gap-2.5"><MessageSquare className="h-4 w-4 text-indigo-500" /> Community Discussion Feed</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </>
              )}

              {roleName === "volunteer" && (
                <>
                  <Link href="/volunteer" onClick={onClose} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-900 rounded-xl transition-colors group">
                    <span className="flex items-center gap-2.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Educator Impact Overview</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/volunteer?tab=uploads" onClick={onClose} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-900 rounded-xl transition-colors group">
                    <span className="flex items-center gap-2.5"><BookOpen className="h-4 w-4 text-sky-500" /> My Uploaded Study Notes</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/volunteer?tab=events" onClick={onClose} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-900 rounded-xl transition-colors group">
                    <span className="flex items-center gap-2.5"><Calendar className="h-4 w-4 text-purple-500" /> Bootcamps & PYQ Sessions</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/community" onClick={onClose} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-900 rounded-xl transition-colors group">
                    <span className="flex items-center gap-2.5"><MessageSquare className="h-4 w-4 text-indigo-500" /> Community Forum</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </>
              )}

              {roleName === "alumni" && (
                <>
                  <Link href="/alumni" onClick={onClose} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-900 rounded-xl transition-colors group">
                    <span className="flex items-center gap-2.5"><Award className="h-4 w-4 text-indigo-500" /> Alumni Mentorship Overview</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/alumni?tab=requests" onClick={onClose} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-900 rounded-xl transition-colors group">
                    <span className="flex items-center gap-2.5"><Users className="h-4 w-4 text-sky-500" /> Mentee Requests & 1-on-1 Chats</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/community" onClick={onClose} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-900 rounded-xl transition-colors group">
                    <span className="flex items-center gap-2.5"><MessageSquare className="h-4 w-4 text-emerald-500" /> Career Guidance & Posts</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </>
              )}

              {(roleName === "admin" || roleName === "super_admin") && (
                <>
                  <Link href="/admin" onClick={onClose} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-900 rounded-xl transition-colors group">
                    <span className="flex items-center gap-2.5"><Settings className="h-4 w-4 text-amber-500" /> Admin Control Center</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/admin?tab=users" onClick={onClose} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-900 rounded-xl transition-colors group">
                    <span className="flex items-center gap-2.5"><Users className="h-4 w-4 text-sky-500" /> User Roles & Approvals</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/resources" onClick={onClose} className="flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-sky-50 dark:hover:bg-zinc-900 rounded-xl transition-colors group">
                    <span className="flex items-center gap-2.5"><BookOpen className="h-4 w-4 text-emerald-500" /> Resource Library Audit</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* EDIT PROFILE FORM */}
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              EDIT ACCOUNT DETAILS
            </h4>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Full Name</label>
              <input
                name="full_name"
                value={formData.profile.full_name}
                onChange={handleProfileChange}
                className="w-full px-3.5 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Phone</label>
              <input
                name="phone"
                value={formData.profile.phone}
                onChange={handleProfileChange}
                className="w-full px-3.5 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {roleName === "volunteer" && (
              <div className="space-y-3 pt-2">
                {user?.volunteer_profile?.assigned_role && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px]">
                    <span className="font-bold text-amber-700 dark:text-amber-300">SAMIDHA Role Designation:</span>{" "}
                    <span className="font-extrabold text-amber-600 dark:text-amber-200 uppercase">
                      {user.volunteer_profile.assigned_role}
                    </span>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Assigned by SAMIDHA Administration
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Academic Year *</label>
                  <select
                    name="academic_year"
                    value={(formData.volunteer_profile as any).academic_year || "3rd Year"}
                    onChange={(e) => handleRoleChange("volunteer_profile", e)}
                    className="w-full px-3.5 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">WhatsApp Mobile Number</label>
                  <input
                    name="whatsapp_number"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={(formData.volunteer_profile as any).whatsapp_number || ""}
                    onChange={(e) => handleRoleChange("volunteer_profile", e)}
                    className="w-full px-3.5 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">About Me / Bio</label>
              <textarea
                name="bio"
                value={formData.profile.bio}
                onChange={handleProfileChange}
                rows={2}
                className="w-full px-3.5 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
          </form>
        </div>

        {/* PINNED FOOTER ACTIONS */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 shrink-0 space-y-2">
          <Button type="submit" form="profile-form" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-sky-500/20">
            <Save className="h-4 w-4 mr-1.5" /> Save Changes
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              type="button" 
              variant="outline" 
              className="text-zinc-700 dark:text-zinc-300 text-xs font-bold"
              onClick={() => {
                logout();
                onClose();
              }}
            >
              <LogOut className="h-3.5 w-3.5 mr-1 text-sky-500" /> Log Out
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-xs font-bold"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      </aside>

      {/* DELETE ACCOUNT CONFIRMATION / RESTRICTION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" /> Account Removal Request
              </h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-zinc-500 hover:text-zinc-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {isVolunteerOrAlumniVerified ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-2xl leading-relaxed">
                  🔒 <strong>Verified Profile Notice:</strong> Verified Volunteer Educator and Alumni Mentor accounts cannot be self-deleted to preserve student learning records and bootcamp histories.
                  <br /><br />
                  If you wish to deactivate your profile, please contact an Administrator directly.
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setDeleteModalOpen(false)} className="bg-sky-600 text-white font-bold text-xs">
                    Understand & Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Are you sure you want to permanently delete your account? All your bookmarks and progress metrics will be removed.
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    isLoading={isDeleting} 
                    onClick={handleDeleteAccountConfirm} 
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    Confirm Permanent Deletion
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
