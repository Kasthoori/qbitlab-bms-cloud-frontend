import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, BellRing, MessageSquareText, X } from "lucide-react";
import {
  BmsApi,
  type DashboardNotificationItemDto,
  type DashboardNotificationSummaryDto,
} from "@/api/bms";

type ActiveMenu = "ALARMS" | "MESSAGES" | null;

function badgeClass(count: number, danger = false) {
  if (count <= 0) return "hidden";

  return danger
    ? "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-rose-200/70 bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30"
    : "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-cyan-200/70 bg-cyan-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-cyan-500/30";
}

function severityClass(severity?: string | null) {
  if (severity === "CRITICAL") {
    return "border-rose-300/30 bg-rose-500/10 text-rose-100";
  }

  if (severity === "WARNING") {
    return "border-amber-300/30 bg-amber-500/10 text-amber-100";
  }

  return "border-cyan-300/30 bg-cyan-500/10 text-cyan-100";
}

function formatCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

function removeNotificationFromSummary(
  current: DashboardNotificationSummaryDto,
  notificationId: string
): DashboardNotificationSummaryDto {
  const alarms = current.alarms.filter((item) => item.id !== notificationId);
  const messages = current.messages.filter((item) => item.id !== notificationId);

  return {
    ...current,
    alarms,
    messages,
    alarmCount: alarms.length,
    messageCount: messages.length,
  };
}

export default function DashboardNotificationIcons() {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [data, setData] = useState<DashboardNotificationSummaryDto | null>(
    null
  );
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(null);
  const [loading, setLoading] = useState(false);
  const [openingNotificationId, setOpeningNotificationId] = useState<
    string | null
  >(null);

  async function loadNotifications() {
    try {
      setLoading(true);

      const response = await BmsApi.getDashboardNotifications();

      /*
       * Useful while testing production notification table.
       * You can remove this later.
       */
      console.log("Dashboard notifications response:", response);

      setData(response);
    } catch (error) {
      console.error("Failed to load dashboard notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  /*
   * Loads unread notifications when the topbar mounts.
   * Also refreshes every 30 seconds so new alarms/messages appear without page refresh.
   */
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);

        const response = await BmsApi.getDashboardNotifications();

        /*
         * Useful while testing production notification table.
         * You can remove this later.
         */
        console.log("Dashboard notifications response:", response);

        if (!cancelled) {
          setData(response);
        }
      } catch (error) {
        console.error("Failed to load dashboard notifications:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();

    const intervalId = window.setInterval(run, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  /*
   * Closes dropdown when user clicks outside the notification area.
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const alarmCount = data?.alarmCount ?? 0;
  const messageCount = data?.messageCount ?? 0;

  const items =
    activeMenu === "ALARMS" ? data?.alarms ?? [] : data?.messages ?? [];

  /*
   * Production read behavior:
   * - Mark notification as read in backend.
   * - Remove it from current topbar state immediately.
   * - Navigate to linked location.
   *
   * This clears the badge count for the current user because backend will no
   * longer return this notification in GET /api/dashboard/notifications.
   */
  async function markAsReadAndOpen(item: DashboardNotificationItemDto) {
    if (openingNotificationId) return;

    try {
      setOpeningNotificationId(item.id);

      await BmsApi.markDashboardNotificationAsRead(item.id);

      setData((current) => {
        if (!current) return current;
        return removeNotificationFromSummary(current, item.id);
      });

      setActiveMenu(null);
      navigate(item.link);
    } catch (error) {
      console.error("Failed to mark dashboard notification as read:", error);

      /*
       * Do not block the user from opening the real issue.
       * If the backend call fails, navigation still happens.
       */
      setActiveMenu(null);
      navigate(item.link);
    } finally {
      setOpeningNotificationId(null);
    }
  }

  return (
    <div ref={wrapperRef} className="relative flex items-center gap-2">
      <button
        type="button"
        title="Failure alarms"
        onClick={() => {
          setActiveMenu(activeMenu === "ALARMS" ? null : "ALARMS");
          loadNotifications();
        }}
        className={`relative rounded-2xl border px-3 py-2 transition ${
          alarmCount > 0
            ? "border-rose-300/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
        }`}
      >
        <BellRing className="h-5 w-5" />

        <span className={badgeClass(alarmCount, true)}>
          {formatCount(alarmCount)}
        </span>
      </button>

      <button
        type="button"
        title="Messages"
        onClick={() => {
          setActiveMenu(activeMenu === "MESSAGES" ? null : "MESSAGES");
          loadNotifications();
        }}
        className={`relative rounded-2xl border px-3 py-2 transition ${
          messageCount > 0
            ? "border-cyan-300/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
        }`}
      >
        <MessageSquareText className="h-5 w-5" />

        <span className={badgeClass(messageCount, false)}>
          {formatCount(messageCount)}
        </span>
      </button>

      {activeMenu && (
        <div className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">
                {activeMenu === "ALARMS"
                  ? "Failure alarms"
                  : "Messages & actions"}
              </p>

              <p className="text-xs text-slate-400">
                {loading ? "Refreshing..." : `${items.length} item(s)`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveMenu(null)}
              className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-3">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                No new {activeMenu === "ALARMS" ? "alarms" : "messages"}.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <NotificationItem
                    key={item.id}
                    item={item}
                    disabled={openingNotificationId === item.id}
                    onOpen={() => markAsReadAndOpen(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  item,
  disabled,
  onOpen,
}: {
  item: DashboardNotificationItemDto;
  disabled: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-cyan-300/30 hover:bg-cyan-300/10 disabled:cursor-wait disabled:opacity-60"
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-xl border p-2 ${severityClass(
            item.severity
          )}`}
        >
          <AlertTriangle className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 text-sm font-semibold text-white">
              {item.title}
            </p>

            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${severityClass(
                item.severity
              )}`}
            >
              {item.severity}
            </span>
          </div>

          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300">
            {item.message}
          </p>

          {(item.siteName || item.tenantName) && (
            <p className="mt-2 text-[11px] text-slate-500">
              {item.tenantName ?? "Tenant"} / {item.siteName ?? "Site"}
            </p>
          )}

          <p className="mt-2 text-xs font-medium text-cyan-200">
            {disabled ? "Opening..." : "Open location →"}
          </p>
        </div>
      </div>
    </button>
  );
}