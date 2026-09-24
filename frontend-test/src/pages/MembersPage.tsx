import React, { useState, useEffect, useMemo } from "react";
import { UserProfileInfo, DashboardLayout } from "@/features/dashboard";
import { TeamMemberItem } from "@/features/dashboard/types";
import { fetchUsersApi, createUserApi, deleteUserApi, updateUserStatusApi } from "@/features/dashboard/api";
import {
  Users,
  Search,
  Mail,
  UserPlus,
  Trash2,
  X,
  Plus,
  CheckCircle2,
  Snowflake,
  Filter,
  Layers,
  RotateCcw,
  Sparkles,
} from "@/components/ui/icons";

export interface MembersPageProps {
  user?: UserProfileInfo | null;
  onLogout?: () => void;
}

const DEPARTMENTS = [
  "All Departments",
  "Commercial Sales",
  "Creative Design",
  "Studio & CAD",
  "SAMP Review / PMT",
  "Plant Operations",
  "Logistics & Dispatch",
  "Administrator",
];

const DEPARTMENT_SUBROLES: Record<string, string[]> = {
  "Commercial Sales": ["Marketing Executive", "Junior Marketing"],
  "Creative Design": ["Creative Lead", "Junior Designer"],
  "Studio & CAD": ["CAD Lead Engineer", "Pre-Press Specialist"],
  "SAMP Review / PMT": ["PMT Review Lead", "QA Inspector"],
  "Plant Operations": ["Plant Operations Head", "Production Supervisor"],
  "Logistics & Dispatch": ["Logistics Lead", "Dispatch Coordinator"],
  "Administrator": ["System Administrator"],
};

export const MembersPage: React.FC<MembersPageProps> = ({ user, onLogout }) => {
  const [users, setUsers] = useState<TeamMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "ACTIVE" | "FROZEN">("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal & action states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

  // Check if viewing user is an administrator
  const isViewerAdmin = useMemo(() => {
    if (user?.role?.toLowerCase() === "admin") return true;
    try {
      const raw = localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.role?.toLowerCase() === "admin";
      }
    } catch {
      return false;
    }
    return false;
  }, [user]);

  // Form state for creating a new member
  const [formData, setFormData] = useState({
    name: "",
    userid: "",
    email: "",
    role: "Commercial Sales",
    sub_role: "Marketing Executive",
    password: "User@123",
  });

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUsersApi();
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Department counts
  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = { "All Departments": users.length };
    for (const d of DEPARTMENTS.slice(1)) {
      counts[d] = 0;
    }
    for (const u of users) {
      const r = (u.role || "").toLowerCase();
      if (r.includes("sales")) counts["Commercial Sales"] = (counts["Commercial Sales"] || 0) + 1;
      else if (r.includes("creative")) counts["Creative Design"] = (counts["Creative Design"] || 0) + 1;
      else if (r.includes("studio")) counts["Studio & CAD"] = (counts["Studio & CAD"] || 0) + 1;
      else if (r.includes("samp") || r.includes("pmt") || r.includes("review")) counts["SAMP Review / PMT"] = (counts["SAMP Review / PMT"] || 0) + 1;
      else if (r.includes("plant") || r.includes("operation")) counts["Plant Operations"] = (counts["Plant Operations"] || 0) + 1;
      else if (r.includes("dispatch") || r.includes("logistics")) counts["Logistics & Dispatch"] = (counts["Logistics & Dispatch"] || 0) + 1;
      else if (r.includes("admin")) counts["Administrator"] = (counts["Administrator"] || 0) + 1;
    }
    return counts;
  }, [users]);

  // High-level KPI Stats
  const stats = useMemo(() => {
    const total = users.length;
    let active = 0;
    let frozen = 0;
    let admins = 0;
    const deptsSet = new Set<string>();

    for (const u of users) {
      if (u.is_active) active++;
      else frozen++;
      if (u.role && u.role.toLowerCase() === "admin") admins++;
      if (u.role) deptsSet.add(u.role.trim());
    }

    return {
      total,
      active,
      frozen,
      admins,
      departmentsCount: deptsSet.size || DEPARTMENTS.length - 1,
    };
  }, [users]);

  // Filtered list based on search, department, and status
  const filteredUsers = useMemo(() => {
    let list = users;

    // Filter by department
    if (selectedDept !== "All Departments") {
      const d = selectedDept.toLowerCase();
      list = list.filter((u) => {
        const r = (u.role || "").toLowerCase();
        if (d.includes("sales")) return r.includes("sales");
        if (d.includes("creative")) return r.includes("creative");
        if (d.includes("studio")) return r.includes("studio");
        if (d.includes("samp") || d.includes("pmt")) return r.includes("samp") || r.includes("pmt") || r.includes("review");
        if (d.includes("plant")) return r.includes("plant") || r.includes("operation");
        if (d.includes("dispatch") || d.includes("logistics")) return r.includes("dispatch") || r.includes("logistics");
        if (d.includes("admin")) return r.includes("admin");
        return true;
      });
    }

    // Filter by status
    if (selectedStatus === "ACTIVE") {
      list = list.filter((u) => u.is_active);
    } else if (selectedStatus === "FROZEN") {
      list = list.filter((u) => !u.is_active);
    }

    // Filter by search query
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          (u.sub_role && u.sub_role.toLowerCase().includes(q)) ||
          u.userid.toLowerCase().includes(q)
      );
    }

    return list;
  }, [users, selectedDept, selectedStatus, searchTerm]);

  const handleDepartmentChange = (dept: string) => {
    const subRoles = DEPARTMENT_SUBROLES[dept] || [];
    setFormData((prev) => ({
      ...prev,
      role: dept,
      sub_role: subRoles[0] || "",
    }));
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.name.trim() || !formData.userid.trim() || !formData.email.trim()) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    const res = await createUserApi({
      name: formData.name.trim(),
      userid: formData.userid.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      sub_role: formData.sub_role,
      password: formData.password || "User@123",
      is_active: true,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Failed to create team member.");
      return;
    }

    // Reset & close
    setFormData({
      name: "",
      userid: "",
      email: "",
      role: "Commercial Sales",
      sub_role: "Marketing Executive",
      password: "User@123",
    });
    setIsModalOpen(false);
    loadMembers();
  };

  const handleToggleFreeze = async (userId: number, willBeActive: boolean, userName: string) => {
    if (!isViewerAdmin) {
      alert("Permission denied. Only administrators have permission to freeze or unfreeze accounts.");
      return;
    }

    const confirmMessage = willBeActive
      ? `Are you sure you want to unfreeze "${userName}"?\n\nThe user will regain access and be able to log in to the system.`
      : `Are you sure you want to freeze "${userName}"?\n\nThe user will be immediately blocked and automatically logged out of all active sessions.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setActionInProgressId(userId);
    try {
      const res = await updateUserStatusApi(userId, willBeActive);
      if (!res.success) {
        alert(res.error || "Failed to update member status.");
      } else {
        await loadMembers();
      }
    } catch {
      alert("Error occurred while updating account status.");
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDeleteMember = async (userId: number, userName: string) => {
    if (!isViewerAdmin) {
      alert("Permission denied. Only administrators can delete team accounts.");
      return;
    }

    if (!window.confirm(`⚠️ PERMANENT ACTION:\n\nAre you sure you want to permanently delete "${userName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    setActionInProgressId(userId);
    try {
      const res = await deleteUserApi(userId);
      if (!res.success) {
        alert(res.error || "Failed to delete team member.");
      } else {
        await loadMembers();
      }
    } catch {
      alert("Error occurred while deleting team member.");
    } finally {
      setActionInProgressId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("admin")) return "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60";
    if (r.includes("sales") || r.includes("commercial")) return "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60";
    if (r.includes("creative")) return "bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200/80 dark:border-pink-800/60";
    if (r.includes("studio") || r.includes("cad")) return "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60";
    if (r.includes("samp") || r.includes("pmt")) return "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60";
    if (r.includes("plant")) return "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60";
    if (r.includes("dispatch") || r.includes("logistics")) return "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/60";
    return "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      title="Team Members Directory"
      subtitle="Manage enterprise staff accounts, departmental hierarchies, roles, and system permissions."
    >
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {/* =========================================================================
            SECTION 1: Staff KPI Metrics Cards (4 Cards)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Registered Staff */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Staff
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {stats.total}
              </div>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                <Sparkles size={11} />
                <span>Enterprise Workforce</span>
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/80 dark:to-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0 shadow-2xs">
              <Users size={22} />
            </div>
          </div>

          {/* Card 2: Active Accounts */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Staff
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {stats.active}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Operational & Ready</span>
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/80 dark:to-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0 shadow-2xs">
              <CheckCircle2 size={22} />
            </div>
          </div>

          {/* Card 3: Frozen / Suspended */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Frozen Accounts
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {stats.frozen}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                {stats.frozen > 0 ? "Access Suspended" : "Zero Blocked Staff"}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/80 dark:to-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 shrink-0 shadow-2xs">
              <Snowflake size={22} />
            </div>
          </div>

          {/* Card 4: Departments Represented */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Departments
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {stats.departmentsCount}
              </div>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                <span>{stats.admins} Administrator{stats.admins === 1 ? "" : "s"}</span>
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/80 dark:to-purple-900/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 shrink-0 shadow-2xs">
              <Layers size={22} />
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 2: Main Workspace & Filter Control Card
            ========================================================================= */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          {/* Header Controls: Search + Status Filter + View Toggle + Add Button */}
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Title */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100/80 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                    <span>Staff Directory</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 font-mono">
                      {filteredUsers.length} shown
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Search and manage team members across all operational units
                  </p>
                </div>
              </div>

              {/* Right Action Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-64 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, role, email..."
                    className="w-full h-9 pl-10 pr-7 text-xs bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Status Toggle (All / Active / Frozen) */}
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("ALL")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      selectedStatus === "ALL" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("ACTIVE")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      selectedStatus === "ACTIVE" ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("FROZEN")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      selectedStatus === "FROZEN" ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-2xs font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    Frozen
                  </button>
                </div>

                {/* View Switcher (Grid / Table) */}
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      viewMode === "grid" ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                    title="Cards Grid View"
                  >
                    Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      viewMode === "table" ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                    title="Table List View"
                  >
                    Table
                  </button>
                </div>

                {/* Add Member Button */}
                {isViewerAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer shrink-0"
                    title="Register New Team Member"
                  >
                    <UserPlus size={14} />
                    <span>Add Member</span>
                  </button>
                )}
              </div>
            </div>

            {/* Department Filter Pills */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
                <Filter size={12} />
                <span>Unit:</span>
              </span>
              {DEPARTMENTS.map((dept) => {
                const count = deptCounts[dept] || 0;
                const isSelected = selectedDept === dept;
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDept(dept)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-xs font-semibold"
                        : "bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>{dept}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected
                          ? "bg-indigo-700/70 text-white"
                          : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Body Content: Loading / Empty / Grid / Table */}
          {isLoading ? (
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200/80 dark:bg-slate-800" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-28 bg-slate-200/80 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-36 bg-slate-200/80 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="h-5 w-20 bg-slate-200/80 dark:bg-slate-800 rounded-md" />
                    <div className="h-5 w-16 bg-slate-200/80 dark:bg-slate-800 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50/40 dark:bg-slate-900/40">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Users size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Staff Members Found</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {searchTerm || selectedDept !== "All Departments" || selectedStatus !== "ALL"
                  ? "No members match the selected filters."
                  : "Your team directory is currently empty. Add your first team member above."}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {(searchTerm || selectedDept !== "All Departments" || selectedStatus !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedDept("All Departments");
                      setSelectedStatus("ALL");
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
                {isViewerAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Member</span>
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === "grid" ? (
            /* =========================================================================
               CARDS GRID VIEW
               ========================================================================= */
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredUsers.map((member) => {
                const isMemberAdmin = member.role.toLowerCase() === "admin" || member.id === 1;
                const isBusy = actionInProgressId === member.id;
                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between space-y-3.5 bg-white dark:bg-slate-900 ${
                      !member.is_active
                        ? "border-amber-200/80 dark:border-amber-900/50 bg-amber-50/10 dark:bg-amber-950/10 shadow-2xs"
                        : "border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10"
                    }`}
                  >
                    {/* Top Row: Avatar + Name + Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`relative h-11 w-11 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs text-white ${
                            !member.is_active
                              ? "bg-slate-400 dark:bg-slate-600"
                              : "bg-gradient-to-br from-indigo-500 to-indigo-700"
                          }`}
                        >
                          {getInitials(member.name)}
                          {member.is_active ? (
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                          ) : (
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4
                              className={`text-sm font-bold truncate ${
                                !member.is_active
                                  ? "text-slate-500 dark:text-slate-400 line-through decoration-slate-300"
                                  : "text-slate-900 dark:text-slate-100"
                              }`}
                              title={member.name}
                            >
                              {member.name}
                            </h4>
                            {isMemberAdmin && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                ROOT
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">
                            @{member.userid}
                          </p>
                        </div>
                      </div>

                      {/* Status indicator pill */}
                      {member.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0">
                          <Snowflake size={10} />
                          <span>Frozen</span>
                        </span>
                      )}
                    </div>

                    {/* Middle: Role, Sub-Role & Email */}
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${getRoleBadge(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                        {member.sub_role && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                            {member.sub_role}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                        <Mail size={13} className="text-slate-400 shrink-0" />
                        <a
                          href={`mailto:${member.email}`}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate font-medium"
                          title={member.email}
                        >
                          {member.email}
                        </a>
                      </div>
                    </div>

                    {/* Bottom: Action Controls */}
                    {isViewerAdmin && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        {isMemberAdmin ? (
                          <span className="text-[11px] font-bold text-slate-400 italic">
                            Administrator Protected
                          </span>
                        ) : (
                          <>
                            {isBusy ? (
                              <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                                <RotateCcw size={12} className="animate-spin" />
                                <span>Updating...</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleFreeze(member.id, !member.is_active, member.name)}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                                  member.is_active
                                    ? "text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                                    : "text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                                }`}
                              >
                                {member.is_active ? "Freeze Account" : "Unfreeze"}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member.id, member.name)}
                              disabled={isBusy}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                              title={`Delete ${member.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* =========================================================================
               DATA TABLE VIEW
               ========================================================================= */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-5 sm:px-6">Staff Member</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Sub-Role / Designation</th>
                    <th className="py-3 px-4">Contact Email</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-5 sm:px-6 text-right">
                      {isViewerAdmin ? "Manage Access" : "Status"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredUsers.map((member) => {
                    const isMemberAdmin = member.role.toLowerCase() === "admin" || member.id === 1;
                    const isBusy = actionInProgressId === member.id;
                    return (
                      <tr
                        key={member.id}
                        className={`transition-colors ${
                          !member.is_active
                            ? "bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/40"
                            : "hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20"
                        }`}
                      >
                        {/* Member Details */}
                        <td className="py-3.5 px-5 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`relative h-9 w-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs text-white ${
                                !member.is_active
                                  ? "bg-slate-400 dark:bg-slate-600"
                                  : "bg-gradient-to-br from-indigo-500 to-indigo-700"
                              }`}
                            >
                              {getInitials(member.name)}
                              {member.is_active ? (
                                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                              ) : (
                                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-bold truncate ${
                                    !member.is_active
                                      ? "text-slate-500 dark:text-slate-400 line-through decoration-slate-300"
                                      : "text-slate-900 dark:text-slate-100"
                                  }`}
                                >
                                  {member.name}
                                </span>
                                {isMemberAdmin && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    ROOT
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                @{member.userid}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${getRoleBadge(
                              member.role
                            )}`}
                          >
                            {member.role}
                          </span>
                        </td>

                        {/* Sub-Role */}
                        <td className="py-3.5 px-4">
                          {member.sub_role ? (
                            <span className="inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 font-medium">
                              {member.sub_role}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Standard</span>
                          )}
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          <a
                            href={`mailto:${member.email}`}
                            className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                          >
                            <Mail size={13} className="text-slate-400" />
                            <span>{member.email}</span>
                          </a>
                        </td>

                        {/* Account Status */}
                        <td className="py-3.5 px-4">
                          {member.is_active ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200/70 dark:border-emerald-800/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active Staff
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-200/80 dark:border-amber-800/60">
                              <Snowflake size={12} />
                              Account Frozen
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 sm:px-6 text-right">
                          {isMemberAdmin ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700">
                              Protected
                            </span>
                          ) : isViewerAdmin ? (
                            <div className="flex items-center justify-end gap-2">
                              {isBusy ? (
                                <span className="text-xs text-slate-400">Updating...</span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFreeze(member.id, !member.is_active, member.name)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                      member.is_active
                                        ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                                        : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                                    }`}
                                  >
                                    {member.is_active ? "Freeze" : "Unfreeze"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMember(member.id, member.name)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                    title="Delete Member"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Viewer</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =========================================================================
            ADD MEMBER MODAL WINDOW
            ========================================================================= */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsModalOpen(false);
            }}
          >
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add New Team Member</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Assign role, department, and initial credentials</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateMember} className="p-6 space-y-4 text-xs">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 text-xs font-medium">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">User ID / Username *</label>
                    <input
                      type="text"
                      required
                      value={formData.userid}
                      onChange={(e) => setFormData((prev) => ({ ...prev, userid: e.target.value.toLowerCase().replace(/\s+/g, "") }))}
                      placeholder="e.g. rsharma"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="name@navneet.com"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Department Unit *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                    >
                      {DEPARTMENTS.slice(1).map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Designation / Sub-Role *</label>
                    <select
                      value={formData.sub_role}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sub_role: e.target.value }))}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                    >
                      {(DEPARTMENT_SUBROLES[formData.role] || []).map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Initial Password</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono text-xs focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">Default password is User@123. The member can reset this anytime.</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RotateCcw size={13} className="animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Save Member</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MembersPage;
