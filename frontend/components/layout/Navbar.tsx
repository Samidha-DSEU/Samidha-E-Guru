"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Sparkles, User, ShieldCheck, GraduationCap, Award, X, Mail, Menu, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ProfileSidebar } from "./ProfileSidebar";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/services/apiClient";
import { getUserHomeLink, getRoleFromUserOrToken } from "@/lib/userUtils";

interface VolunteerHeadItem {
  id: string;
  full_name: string;
  academic_year: string;
  samidha_designation: string;
  subjects?: string;
  email: string;
  whatsapp_number?: string;
  avatar_url?: string;
  avatar_initials?: string;
}

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // DYNAMIC VOLUNTEER HEADS STATE
  const [volunteerHeads, setVolunteerHeads] = useState<VolunteerHeadItem[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerHeadItem | null>(null);
  const [studentForm, setStudentForm] = useState({
    full_name: "",
    mobile: "",
    email: "",
    needed_subject: "Physics & Chemistry",
    message: ""
  });
  const [inquirySent, setInquirySent] = useState(false);

  useEffect(() => {
    // Fetch real active Operational & Volunteer Heads from API if available
    const fetchVolunteerHeads = async () => {
      try {
        const res = await apiClient.get<{ data: VolunteerHeadItem[] }>("/mentorship/volunteer-heads");
        if (res.data?.data) {
          setVolunteerHeads(res.data.data);
        } else {
          setVolunteerHeads([]);
        }
      } catch {
        setVolunteerHeads([]);
      }
    };
    if (isMentorModalOpen) {
      fetchVolunteerHeads();
    }
  }, [isMentorModalOpen]);

  const getHomeLink = () => {
    return getUserHomeLink(user);
  };

  const getPortalLabel = () => {
    if (!user) return "";
    const roleName = getRoleFromUserOrToken(user) || (user.role?.name ? user.role.name.toLowerCase() : "student");
    switch (roleName) {
      case "super_admin":
        return "Super Admin Portal";
      case "admin":
        return "Admin Portal";
      case "volunteer":
        return "Volunteer Portal";
      case "alumni":
        return "Alumni Portal";
      case "student":
      default:
        return "Student Portal";
    }
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.full_name || !studentForm.mobile) return;
    setInquirySent(true);
  };

  const resetMentorModal = () => {
    setIsMentorModalOpen(false);
    setSelectedVolunteer(null);
    setInquirySent(false);
    setStudentForm({ full_name: "", mobile: "", email: "", needed_subject: "Physics & Chemistry", message: "" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0 py-1">
          <div className="relative flex items-center justify-center h-9 w-9 shrink-0">
            <div className="absolute inset-0 bg-sky-500/20 rounded-xl blur-md group-hover:bg-sky-500/40 transition-all" />
            {!logoError ? (
              <img
                src="/logo.png"
                alt="SAMIDHA E-GURU Logo"
                className="h-9 w-9 relative z-10 object-contain shrink-0 rounded-lg transition-transform group-hover:scale-105"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center font-bold text-base relative z-10 border border-sky-200 dark:border-sky-800">
                S
              </div>
            )}
          </div>
          <span className="font-extrabold text-base sm:text-lg tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors whitespace-nowrap">
            SAMIDHA <span className="text-sky-600 dark:text-sky-400">E-GURU</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <Link href="/" className="text-sm font-semibold text-zinc-600 hover:text-sky-600 dark:text-zinc-300 dark:hover:text-sky-400 transition-colors px-1 py-1">
            Home
          </Link>
          <Link href="/resources" className="text-sm font-semibold text-zinc-600 hover:text-sky-600 dark:text-zinc-300 dark:hover:text-sky-400 transition-colors px-1 py-1">
            Resources
          </Link>
          <Link href="/community" className="text-sm font-semibold text-zinc-600 hover:text-sky-600 dark:text-zinc-300 dark:hover:text-sky-400 transition-colors px-1 py-1">
            Community
          </Link>

          <button
            onClick={() => setIsMentorModalOpen(true)}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center gap-1.5 transition-all bg-sky-500/10 dark:bg-sky-500/15 px-3.5 py-1.5 rounded-xl border border-sky-500/30 shadow-sm hover:scale-105"
          >
            <Sparkles className="h-4 w-4 text-sky-500" />
            Get Mentor
          </button>

          <Link href="/about" className="text-sm font-semibold text-zinc-600 hover:text-sky-600 dark:text-zinc-300 dark:hover:text-sky-400 transition-colors px-1 py-1">
            About
          </Link>
        </nav>

        {/* Right Actions & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2.5 shrink-0">
              <Link href={getHomeLink()} className="flex flex-col items-end hidden sm:flex group">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 leading-none group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {user.profile?.full_name || "User"}
                </span>
                <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold capitalize mt-0.5 group-hover:underline">
                  {getPortalLabel()} ➔
                </span>
              </Link>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="h-9 w-9 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center border-2 border-sky-500/30 hover:border-sky-500 transition-all overflow-hidden"
              >
                {user.profile?.avatar_url ? (
                  <img src={user.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                className="text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-sky-500/20 whitespace-nowrap shrink-0"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-4 space-y-3">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Home
          </Link>
          <Link href="/resources" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Resources
          </Link>
          <Link href="/community" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Community
          </Link>
          <button
            onClick={() => { setIsMobileMenuOpen(false); setIsMentorModalOpen(true); }}
            className="w-full text-left text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2 py-1"
          >
            <Sparkles className="h-4 w-4" /> Get Mentor
          </button>
          <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            About SAMIDHA
          </Link>
        </div>
      )}

      {/* Profile Sidebar */}
      <ProfileSidebar isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* GET MENTOR MODAL (PORTAL TO BODY TO PREVENT HEADER CLIPPING) */}
      {mounted && isMentorModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 min-h-screen overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-sky-500" /> Connect with Operational & Volunteer Heads
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Direct inquiry line to verified 3rd & 4th year SAMIDHA Volunteer Heads via Email & Instant WhatsApp.
                </p>
              </div>
              <button 
                onClick={resetMentorModal} 
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Close Modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!selectedVolunteer ? (
              /* VOLUNTEER HEADS DIRECTORY LIST */
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {volunteerHeads.length === 0 ? (
                  <div className="p-8 text-center space-y-4 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                    <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center border border-amber-500/20">
                      <Award className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">No Operational & Volunteer Heads Designated Yet</h4>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                        SAMIDHA Administrators assign Operational & Volunteer Head designations to verified 3rd & 4th year volunteer educators in the Admin Control Panel.
                      </p>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" size="sm" onClick={resetMentorModal} className="text-xs">
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  volunteerHeads.map((vol) => (
                    <div key={vol.id} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-start gap-4 hover:border-sky-500/40 transition-all">
                      {vol.avatar_url ? (
                        <img
                          src={vol.avatar_url}
                          alt={vol.full_name}
                          className="h-12 w-12 rounded-2xl object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm border border-amber-300/40 shrink-0">
                          {vol.avatar_initials || vol.full_name?.split(' ').map(n=>n[0]).join('') || "VH"}
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{vol.full_name}</h4>
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold rounded-full border border-amber-500/30">
                            👑 {vol.samidha_designation} ({vol.academic_year})
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">Specialization: {vol.subjects || "Academic & Career Guidance"}</p>
                        
                        <div className="pt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => setSelectedVolunteer(vol)}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm"
                          >
                            <Send className="h-3.5 w-3.5 mr-1.5" /> Connect & Request Guidance
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : !inquirySent ? (
              /* STUDENT INQUIRY FORM */
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="p-3 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                      {selectedVolunteer.avatar_url ? (
                        <img src={selectedVolunteer.avatar_url} alt={selectedVolunteer.full_name} className="h-full w-full object-cover" />
                      ) : (
                        selectedVolunteer.avatar_initials || "VH"
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{selectedVolunteer.full_name}</h4>
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">{selectedVolunteer.samidha_designation}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelectedVolunteer(null)} className="text-xs text-sky-600 hover:underline">
                    Change Volunteer
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Rahul Kumar"
                    value={studentForm.full_name}
                    onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                    className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={studentForm.mobile}
                      onChange={(e) => setStudentForm({ ...studentForm, mobile: e.target.value })}
                      className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email Address</label>
                    <input
                      type="email"
                      placeholder="student@example.com"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Subject / Academic Topic Needed</label>
                  <input
                    type="text"
                    value={studentForm.needed_subject}
                    onChange={(e) => setStudentForm({ ...studentForm, needed_subject: e.target.value })}
                    className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Note / Message</label>
                  <textarea
                    rows={2}
                    placeholder="Briefly state guidance required..."
                    value={studentForm.message}
                    onChange={(e) => setStudentForm({ ...studentForm, message: e.target.value })}
                    className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" type="button" onClick={() => setSelectedVolunteer(null)}>
                    Back
                  </Button>
                  <Button type="submit" size="sm" className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4">
                    Send Inquiry & Connect
                  </Button>
                </div>
              </form>
            ) : (
              /* SUCCESS CONFIRMATION & INSTANT WHATSAPP CONNECT */
              <div className="space-y-5 text-center py-2">
                <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 mx-auto flex items-center justify-center border-2 border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50">Inquiry Dispatched to {selectedVolunteer.full_name}!</h3>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    Your contact details (Mobile: {studentForm.mobile}) have been emailed directly to <strong>{selectedVolunteer.email}</strong>.
                  </p>
                </div>

                {/* DIRECT ACTION BUTTONS: EMAIL + INSTANT WHATSAPP */}
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                    💬 Connect Live on WhatsApp Now
                  </span>
                  
                  {selectedVolunteer.whatsapp_number ? (
                    <a
                      href={`https://wa.me/${selectedVolunteer.whatsapp_number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Hi ${selectedVolunteer.full_name}, I am ${studentForm.full_name} (Mobile: ${studentForm.mobile}). I am seeking guidance for ${studentForm.needed_subject} on SAMIDHA E-GURU.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-transform active:scale-95"
                    >
                      <MessageSquare className="h-4 w-4" /> Open WhatsApp Chat with {selectedVolunteer.full_name}
                    </a>
                  ) : (
                    <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/60 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 font-medium">
                      ⚠️ Volunteer has not provided a mobile number. Please send a direct email below.
                    </p>
                  )}

                  <a
                    href={`mailto:${selectedVolunteer.email}?subject=${encodeURIComponent(`Mentorship Inquiry from Student ${studentForm.full_name}`)}&body=${encodeURIComponent(`Hi ${selectedVolunteer.full_name},\n\nStudent Name: ${studentForm.full_name}\nMobile: ${studentForm.mobile}\nSubject: ${studentForm.needed_subject}\n\nNote:\n${studentForm.message}`)}`}
                    className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:underline font-semibold"
                  >
                    <Mail className="h-3.5 w-3.5" /> Also Send Direct Email to {selectedVolunteer.email}
                  </a>
                </div>

                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={resetMentorModal} className="text-xs font-bold">
                    Done & Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
