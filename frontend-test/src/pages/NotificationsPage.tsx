import React, { useState } from "react";
import { UserProfileInfo, DashboardLayout } from "@/features/dashboard";
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Factory,
  FileText,
  Palette,
  Trash2,
} from "@/components/ui/icons";

export interface NotificationsPageProps {
  user?: UserProfileInfo | null;
  onLogout?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: "request" | "creative" | "plant" | "system";
  department: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Sample Request Status Updated",
    description: "Sample SR-2026-0042 has progressed from Intake to Creative Artwork pipeline.",
    timestamp: "10 mins ago",
    read: false,
    type: "creative",
    department: "Creative Design",
  },
  {
    id: "notif-2",
    title: "Plant Allocation Finalized",
    description: "Khaniwade Central plant confirmed capacity for 4 new batch sampling packages.",
    timestamp: "35 mins ago",
    read: false,
    type: "plant",
    department: "Plant Operations",
  },
  {
    id: "notif-3",
    title: "New Technical Specification Added",
    description: "Paper grade GSM 80 and Wire-O binding specifications uploaded for BTS 2027.",
    timestamp: "2 hours ago",
    read: false,
    type: "request",
    department: "SAMP Review / PMT",
  },
  {
    id: "notif-4",
    title: "Commercial Deal Confirmed",
    description: "Actual deal conversion registered for Walmart BTS Program 2026.",
    timestamp: "5 hours ago",
    read: true,
    type: "request",
    department: "Commercial Sales",
  },
  {
    id: "notif-5",
    title: "System Synchronization Complete",
    description: "Master materials catalog synchronized with plant ERP production lines.",
    timestamp: "1 day ago",
    read: true,
    type: "system",
    department: "System Operations",
  },
];

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  user,
  onLogout,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  });

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "creative":
        return <Palette size={16} className="text-rose-600 dark:text-rose-400" />;
      case "plant":
        return <Factory size={16} className="text-amber-600 dark:text-amber-400" />;
      case "request":
        return <FileText size={16} className="text-blue-600 dark:text-blue-400" />;
      default:
        return <Bell size={16} className="text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      title="Notifications Hub"
      subtitle="Operational activity alerts, sample pipeline milestones, and plant notices."
    >
      <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
        {/* Header Controls Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center shadow-2xs">
              <Bell size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Recent Alerts
                </h2>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white font-mono">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track status handoffs and department updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filter === "all"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  filter === "unread"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="h-8.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Check size={13} className="stroke-[2.5]" />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                You're all caught up!
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No unread notifications at this time.
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3.5 cursor-pointer ${
                  !n.read
                    ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/60 shadow-xs"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-xs sm:text-sm font-bold truncate ${
                          !n.read
                            ? "text-slate-900 dark:text-slate-100"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200/70 dark:border-slate-700">
                        {n.department}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {n.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium pt-0.5">
                      <Clock size={11} />
                      <span>{n.timestamp}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(n.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                  title="Remove notification"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
