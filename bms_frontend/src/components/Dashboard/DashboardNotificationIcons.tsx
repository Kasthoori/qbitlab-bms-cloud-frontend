import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BellRing,
  MessageSquareText,
  X,
} from "lucide-react";

import {
  BmsApi,
  type DashboardNotificationItemDto,
  type DashboardNotificationSummaryDto,
} from "@/api/bms";

import {
  BmsButton,
  BmsCard,
} from "@/components/UI";


type ActiveMenu =
  | "ALARMS"
  | "MESSAGES"
  | null;


// ============= Badge Helpers =============

function badgeClass(
  count: number,
  danger = false
) {
  if (count <= 0) {
    return "hidden";
  }

  return danger
    ? [
        "absolute",
        "-right-1",
        "-top-1",
        "flex",
        "h-5",
        "min-w-5",
        "items-center",
        "justify-center",
        "rounded-full",
        "border",
        "border-rose-200/70",
        "bg-rose-500",
        "px-1",
        "text-[10px]",
        "font-bold",
        "text-white",
        "shadow-lg",
        "shadow-rose-500/30",
      ].join(" ")
    : [
        "absolute",
        "-right-1",
        "-top-1",
        "flex",
        "h-5",
        "min-w-5",
        "items-center",
        "justify-center",
        "rounded-full",
        "border",
        "border-cyan-200/70",
        "bg-cyan-500",
        "px-1",
        "text-[10px]",
        "font-bold",
        "text-white",
        "shadow-lg",
        "shadow-cyan-500/30",
      ].join(" ");
}


function severityClass(
  severity?: string | null
) {
  if (severity === "CRITICAL") {
    return [
      "border-rose-300/40",
      "bg-rose-500/15",
      "text-rose-100",
    ].join(" ");
  }

  if (severity === "WARNING") {
    return [
      "border-amber-300/40",
      "bg-amber-500/15",
      "text-amber-100",
    ].join(" ");
  }

  return [
    "border-cyan-300/40",
    "bg-cyan-500/15",
    "text-cyan-100",
  ].join(" ");
}


function formatCount(
  count: number
) {
  return count > 99
    ? "99+"
    : String(count);
}


// ============= Notification State Helper =============

function removeNotificationFromSummary(
  current: DashboardNotificationSummaryDto,
  notificationId: string
): DashboardNotificationSummaryDto {
  const alarms =
    current.alarms.filter(
      (item) =>
        item.id !== notificationId
    );

  const messages =
    current.messages.filter(
      (item) =>
        item.id !== notificationId
    );

  return {
    ...current,
    alarms,
    messages,
    alarmCount: alarms.length,
    messageCount: messages.length,
  };
}


// ============= Main Component =============

export default function DashboardNotificationIcons() {
  const navigate = useNavigate();

  const wrapperRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [
    data,
    setData,
  ] =
    useState<DashboardNotificationSummaryDto | null>(
      null
    );

  const [
    activeMenu,
    setActiveMenu,
  ] =
    useState<ActiveMenu>(null);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    openingNotificationId,
    setOpeningNotificationId,
  ] =
    useState<string | null>(
      null
    );


  // ============= Load Notifications =============

  async function loadNotifications() {
    try {
      setLoading(true);

      const response =
        await BmsApi.getDashboardNotifications();

      console.log(
        "Dashboard notifications response:",
        response
      );

      setData(response);
    } catch (error) {
      console.error(
        "Failed to load dashboard notifications:",
        error
      );
    } finally {
      setLoading(false);
    }
  }


  // ============= Auto Refresh =============

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);

        const response =
          await BmsApi.getDashboardNotifications();

        console.log(
          "Dashboard notifications response:",
          response
        );

        if (!cancelled) {
          setData(response);
        }
      } catch (error) {
        console.error(
          "Failed to load dashboard notifications:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    const intervalId =
      window.setInterval(
        run,
        30_000
      );

    return () => {
      cancelled = true;

      window.clearInterval(
        intervalId
      );
    };
  }, []);


  // ============= Close When Clicking Outside =============

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (!wrapperRef.current) {
        return;
      }

      if (
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setActiveMenu(null);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);


  // ============= Derived State =============

  const alarmCount =
    data?.alarmCount ?? 0;

  const messageCount =
    data?.messageCount ?? 0;

  const items =
    activeMenu === "ALARMS"
      ? data?.alarms ?? []
      : data?.messages ?? [];


  // ============= Open Notification =============

  async function markAsReadAndOpen(
    item: DashboardNotificationItemDto
  ) {
    if (openingNotificationId) {
      return;
    }

    try {
      setOpeningNotificationId(
        item.id
      );

      await BmsApi.markDashboardNotificationAsRead(
        item.id
      );

      setData((current) => {
        if (!current) {
          return current;
        }

        return removeNotificationFromSummary(
          current,
          item.id
        );
      });

      setActiveMenu(null);

      navigate(item.link);
    } catch (error) {
      console.error(
        "Failed to mark dashboard notification as read:",
        error
      );

      setActiveMenu(null);

      navigate(item.link);
    } finally {
      setOpeningNotificationId(
        null
      );
    }
  }


  return (
    <div
      ref={wrapperRef}
      className="
        relative
        z-9999
        flex
        items-center
        gap-2
      "
    >

      {/* ================= Failure Alarms Button ================= */}

      <BmsButton
        type="button"
        title="Failure alarms"
        variant={
          alarmCount > 0
            ? "danger"
            : "ghost"
        }
        size="sm"
        onClick={() => {
          setActiveMenu(
            activeMenu === "ALARMS"
              ? null
              : "ALARMS"
          );

          void loadNotifications();
        }}
        className={[
          "relative min-h-0 px-3 py-2",

          alarmCount > 0
            ? [
                "border-rose-300/30",
                "bg-rose-500/10",
                "text-rose-100",
                "hover:bg-rose-500/20",
              ].join(" ")
            : [
                "border-white/10",
                "bg-white/5",
                "text-slate-300",
                "hover:bg-white/10",
              ].join(" "),
        ].join(" ")}
      >
        <BellRing className="h-5 w-5" />

        <span
          className={badgeClass(
            alarmCount,
            true
          )}
        >
          {formatCount(
            alarmCount
          )}
        </span>
      </BmsButton>


      {/* ================= Messages Button ================= */}

      <BmsButton
        type="button"
        title="Messages"
        variant={
          messageCount > 0
            ? "primary"
            : "ghost"
        }
        size="sm"
        onClick={() => {
          setActiveMenu(
            activeMenu === "MESSAGES"
              ? null
              : "MESSAGES"
          );

          void loadNotifications();
        }}
        className={[
          "relative min-h-0 px-3 py-2",

          messageCount > 0
            ? [
                "border-cyan-300/30",
                "bg-cyan-500/10",
                "text-cyan-100",
                "hover:bg-cyan-500/20",
              ].join(" ")
            : [
                "border-white/10",
                "bg-white/5",
                "text-slate-300",
                "hover:bg-white/10",
              ].join(" "),
        ].join(" ")}
      >
        <MessageSquareText className="h-5 w-5" />

        <span
          className={badgeClass(
            messageCount,
            false
          )}
        >
          {formatCount(
            messageCount
          )}
        </span>
      </BmsButton>


      {/* ================= Notification Dropdown ================= */}

      {activeMenu && (
        <div
          className="
            absolute
            right-0
            top-12
            z-9999
            w-90
            overflow-hidden
            rounded-3xl
            border
            border-slate-600/60
            bg-slate-950
            shadow-2xl
            shadow-black/70
            ring-1
            ring-white/5
          "
        >

          {/* ================= Header ================= */}

          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-slate-700/80
              bg-slate-900
              px-4
              py-3
            "
          >
            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-white
                "
              >
                {activeMenu === "ALARMS"
                  ? "Failure alarms"
                  : "Messages & actions"}
              </p>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-400
                "
              >
                {loading
                  ? "Refreshing..."
                  : `${items.length} item(s)`}
              </p>
            </div>

            <BmsButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setActiveMenu(null)
              }
              className="
                min-h-0
                rounded-xl
                border
                border-white/10
                bg-white/5
                px-2
                py-2
                hover:bg-white/10
              "
              title="Close notifications"
            >
              <X className="h-4 w-4" />
            </BmsButton>
          </div>


          {/* ================= Notification List ================= */}

          <div
            className="
              max-h-105
              overflow-y-auto
              bg-slate-950
              p-3
            "
          >
            {items.length === 0 ? (
              <BmsCard
                variant="glass"
                className="
                  border
                  border-white/10
                  bg-slate-900
                  p-4
                  text-sm
                  text-slate-300
                "
              >
                No new{" "}
                {activeMenu === "ALARMS"
                  ? "alarms"
                  : "messages"}
                .
              </BmsCard>
            ) : (
              <div className="space-y-3">
                {items.map(
                  (item) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      disabled={
                        openingNotificationId ===
                        item.id
                      }
                      onOpen={() =>
                        void markAsReadAndOpen(
                          item
                        )
                      }
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ============= Notification Item =============

function NotificationItem({
  item,
  disabled,
  onOpen,
}: {
  item: DashboardNotificationItemDto;
  disabled: boolean;
  onOpen: () => void;
}) {
  const critical =
    item.severity === "CRITICAL";

  const warning =
    item.severity === "WARNING";

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className={[
        "w-full",
        "rounded-2xl",
        "border",
        "p-3",
        "text-left",
        "transition",
        "duration-200",
        "disabled:cursor-wait",
        "disabled:opacity-60",

        critical
          ? [
              "border-rose-400/30",
              "bg-rose-950/40",
              "hover:border-rose-300/50",
              "hover:bg-rose-950/60",
            ].join(" ")
          : warning
          ? [
              "border-amber-400/30",
              "bg-amber-950/30",
              "hover:border-amber-300/50",
              "hover:bg-amber-950/50",
            ].join(" ")
          : [
              "border-cyan-400/20",
              "bg-slate-900",
              "hover:border-cyan-300/40",
              "hover:bg-slate-800",
            ].join(" "),
      ].join(" ")}
    >
      <div
        className="
          flex
          items-start
          gap-3
        "
      >
        <div
          className={[
            "mt-0.5",
            "rounded-xl",
            "border",
            "p-2",
            severityClass(
              item.severity
            ),
          ].join(" ")}
        >
          <AlertTriangle className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="
              flex
              items-start
              justify-between
              gap-2
            "
          >
            <p
              className="
                line-clamp-1
                text-sm
                font-semibold
                text-white
              "
            >
              {item.title}
            </p>

            <span
              className={[
                "shrink-0",
                "rounded-full",
                "border",
                "px-2",
                "py-0.5",
                "text-[10px]",
                "font-semibold",
                severityClass(
                  item.severity
                ),
              ].join(" ")}
            >
              {item.severity}
            </span>
          </div>

          <p
            className="
              mt-1
              line-clamp-2
              text-xs
              leading-5
              text-slate-300
            "
          >
            {item.message}
          </p>

          {(item.siteName ||
            item.tenantName) && (
            <p
              className="
                mt-2
                text-[11px]
                text-slate-500
              "
            >
              {item.tenantName ??
                "Tenant"}{" "}
              /{" "}
              {item.siteName ??
                "Site"}
            </p>
          )}

          <p
            className="
              mt-2
              text-xs
              font-medium
              text-cyan-200
            "
          >
            {disabled
              ? "Opening..."
              : "Open location →"}
          </p>
        </div>
      </div>
    </button>
  );
}