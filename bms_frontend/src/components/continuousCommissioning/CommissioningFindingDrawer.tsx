import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  CheckCircle2,
  ClipboardCheck,
  PlayCircle,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";

import {
  BmsButton,
  BmsTextarea,
} from "@/components/UI";

import {
  ContinuousCommissioningApi,
  type ContinuousCommissioningFindingDto,
} from "@/api/continuousCommissioning";

import {
  commissioningErrorMessage,
  commissioningLifecycleActionLabel,
  formatCommissioningConfidence,
  formatCommissioningDateTime,
  formatCommissioningValue,
  humanizeCommissioningValue,
} from "./commissioningUi";

import {
  CommissioningSeverityBadge,
  CommissioningStatusBadge,
} from "./CommissioningStatusBadge";


type CommissioningFindingDrawerProps = {
  open: boolean;

  tenantId: string;
  siteId: string;

  finding: ContinuousCommissioningFindingDto | null;

  currentUserId?: string;

  onClose: () => void;

  onUpdated: (
    finding: ContinuousCommissioningFindingDto
  ) => void;
};


// ============= Continuous Commissioning Finding Drawer =============

export function CommissioningFindingDrawer({
  open,
  tenantId,
  siteId,
  finding,
  currentUserId,
  onClose,
  onUpdated,
}: CommissioningFindingDrawerProps) {
  const [currentFinding, setCurrentFinding] =
    useState<ContinuousCommissioningFindingDto | null>(finding);

  const [fixNotes, setFixNotes] =
    useState("");

  const [
    verificationSummary,
    setVerificationSummary,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  // ============= Sync Selected Finding =============

  useEffect(() => {
    setCurrentFinding(finding);

    setFixNotes(
      finding?.fixNotes ?? ""
    );

    setVerificationSummary(
      finding?.verificationSummary ?? ""
    );

    setError(null);
  }, [finding]);


  // ============= Load Latest Finding Detail =============

  useEffect(() => {
    if (!open || !finding?.findingId) {
      return;
    }

    const findingId =
      finding.findingId;

    let cancelled = false;

    async function loadFinding() {
      try {
        setLoading(true);
        setError(null);

        const result =
          await ContinuousCommissioningApi.getFindingById(
            tenantId,
            siteId,
            findingId
          );

        if (!cancelled) {
          setCurrentFinding(result);

          setFixNotes(
            result.fixNotes ?? ""
          );

          setVerificationSummary(
            result.verificationSummary ?? ""
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            commissioningErrorMessage(
              requestError
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadFinding();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    tenantId,
    siteId,
    finding?.findingId,
  ]);


  // ============= Lifecycle Helpers =============

  const requiresUserId = useMemo(() => {
    if (!currentFinding) {
      return false;
    }

    return [
      "APPROVAL_PENDING",
      "APPROVED",
      "IN_PROGRESS",
      "FIX_REPORTED",
      "VERIFIED",
    ].includes(
      currentFinding.status
    );
  }, [currentFinding]);


  const actionLabel =
    currentFinding
      ? commissioningLifecycleActionLabel(
          currentFinding.status
        )
      : null;


  if (!currentFinding) {
    return null;
  }


  // ============= Update Finding =============

  async function updateFinding(
    action: () => Promise<ContinuousCommissioningFindingDto>
  ) {
    try {
      setActionLoading(true);
      setError(null);

      const updated =
        await action();

      setCurrentFinding(updated);

      setFixNotes(
        updated.fixNotes ?? ""
      );

      setVerificationSummary(
        updated.verificationSummary ?? ""
      );

      onUpdated(updated);
    } catch (requestError) {
      setError(
        commissioningErrorMessage(
          requestError
        )
      );
    } finally {
      setActionLoading(false);
    }
  }


  // ============= Lifecycle Action =============

  async function handleLifecycleAction() {
    if (!currentFinding) {
      return;
    }

    const {
      findingId,
      status,
    } = currentFinding;


    if (
      requiresUserId &&
      (
        !currentUserId ||
        currentUserId.trim() === ""
      )
    ) {
      setError(
        "Current user ID is unavailable. Please refresh the page and try again."
      );

      return;
    }


    switch (status) {
      case "DETECTED":
        await updateFinding(() =>
          ContinuousCommissioningApi.requestApproval(
            tenantId,
            siteId,
            findingId
          )
        );

        break;


      case "APPROVAL_PENDING":
        await updateFinding(() =>
          ContinuousCommissioningApi.approveFinding(
            tenantId,
            siteId,
            findingId,
            currentUserId!
          )
        );

        break;


      case "APPROVED":
        await updateFinding(() =>
          ContinuousCommissioningApi.markFindingInProgress(
            tenantId,
            siteId,
            findingId,
            currentUserId!
          )
        );

        break;


      case "IN_PROGRESS":
        if (!fixNotes.trim()) {
          setError(
            "Please enter fix notes before reporting the fix."
          );

          return;
        }

        await updateFinding(() =>
          ContinuousCommissioningApi.reportFix(
            tenantId,
            siteId,
            findingId,
            currentUserId!,
            {
              fixNotes:
                fixNotes.trim(),
            }
          )
        );

        break;


      case "FIX_REPORTED":
        if (
          !verificationSummary.trim()
        ) {
          setError(
            "Please enter a verification summary before verifying the finding."
          );

          return;
        }

        await updateFinding(() =>
          ContinuousCommissioningApi.verifyFinding(
            tenantId,
            siteId,
            findingId,
            currentUserId!,
            {
              verificationSummary:
                verificationSummary.trim(),
            }
          )
        );

        break;


      case "VERIFIED":
        await updateFinding(() =>
          ContinuousCommissioningApi.closeFinding(
            tenantId,
            siteId,
            findingId,
            currentUserId!
          )
        );

        break;


      case "CLOSED":
      default:
        break;
    }
  }


  // ============= Finding Information =============

  const informationRows: Array<{
    label: string;
    value: string;
  }> = [
    {
      label: "Finding ID",
      value:
        currentFinding.findingId,
    },
    {
      label: "Finding Type",
      value:
        humanizeCommissioningValue(
          currentFinding.findingType
        ),
    },
    {
      label: "HVAC ID",
      value:
        formatCommissioningValue(
          currentFinding.hvacId
        ),
    },
    {
      label: "External Device",
      value:
        formatCommissioningValue(
          currentFinding.externalDeviceId
        ),
    },
    {
      label: "Detected Value",
      value:
        formatCommissioningValue(
          currentFinding.detectedValue
        ),
    },
    {
      label: "Expected Value",
      value:
        formatCommissioningValue(
          currentFinding.expectedValue
        ),
    },
    {
      label: "Confidence",
      value:
        formatCommissioningConfidence(
          currentFinding.confidence
        ),
    },
    {
      label: "Detected At",
      value:
        formatCommissioningDateTime(
          currentFinding.detectedAt
        ),
    },
  ];


  // ============= Workflow History =============

  const workflowRows: Array<{
    label: string;
    value: string;
  }> = [
    {
      label:
        "Approval Requested",
      value:
        formatCommissioningDateTime(
          currentFinding.approvalRequestedAt
        ),
    },
    {
      label: "Approved",
      value:
        formatCommissioningDateTime(
          currentFinding.approvedAt
        ),
    },
    {
      label: "Work Started",
      value:
        formatCommissioningDateTime(
          currentFinding.inProgressAt
        ),
    },
    {
      label: "Fix Reported",
      value:
        formatCommissioningDateTime(
          currentFinding.fixReportedAt
        ),
    },
    {
      label: "Verified",
      value:
        formatCommissioningDateTime(
          currentFinding.verifiedAt
        ),
    },
    {
      label: "Closed",
      value:
        formatCommissioningDateTime(
          currentFinding.closedAt
        ),
    },
  ];


  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="
            fixed
            inset-x-0
            bottom-0
            top-39
            z-50
            flex
            justify-end
            bg-black/60
            backdrop-blur-sm
          "
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 0.75,
            ease: "easeInOut",
          }}
          onMouseDown={onClose}
        >
          <motion.aside
            className="
              h-full
              w-full
              max-w-2xl
              overflow-y-auto
              border-l
              border-white/10
              bg-slate-950
              p-6
              pb-8
              shadow-2xl
            "
            initial={{
              x: "100%",
              opacity: 0.85,
            }}
            animate={{
              x: 0,
              opacity: 1,
            }}
            exit={{
              x: "100%",
              opacity: 0.85,
            }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
            }}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            {/* ================= Header ================= */}

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.2em]
                    text-cyan-300
                  "
                >
                  Continuous Commissioning
                </p>

                <h2
                  className="
                    mt-2
                    text-2xl
                    font-bold
                    text-white
                  "
                >
                  {currentFinding.title ||
                    humanizeCommissioningValue(
                      currentFinding.findingType
                    )}
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  <CommissioningStatusBadge
                    status={
                      currentFinding.status
                    }
                  />

                  <CommissioningSeverityBadge
                    severity={
                      currentFinding.severity
                    }
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="
                  rounded-xl
                  border
                  border-white/10
                  p-2
                  text-slate-300
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
                aria-label="Close finding drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>


            {/* ================= Loading ================= */}

            {loading && (
              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/3
                  p-4
                  text-sm
                  text-slate-300
                "
              >
                Loading latest finding details...
              </div>
            )}


            {/* ================= Error ================= */}

            {error && (
              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-rose-400/30
                  bg-rose-950/30
                  p-4
                  text-sm
                  text-rose-100
                "
              >
                {error}
              </div>
            )}


            {/* ================= Summary ================= */}

            {currentFinding.summary && (
              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/3
                  p-4
                "
              >
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  Summary
                </p>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-slate-200
                  "
                >
                  {currentFinding.summary}
                </p>
              </div>
            )}


            {/* ================= Description ================= */}

            {currentFinding.description && (
              <div
                className="
                  mt-4
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/3
                  p-4
                "
              >
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  Description
                </p>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-slate-200
                  "
                >
                  {currentFinding.description}
                </p>
              </div>
            )}


            {/* ================= Recommendation ================= */}

            {currentFinding.recommendation && (
              <div
                className="
                  mt-4
                  rounded-2xl
                  border
                  border-cyan-400/20
                  bg-cyan-500/10
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-cyan-200
                  "
                >
                  <ClipboardCheck className="h-4 w-4" />

                  Recommended Action
                </div>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-cyan-50
                  "
                >
                  {currentFinding.recommendation}
                </p>
              </div>
            )}


            {/* ================= Evidence ================= */}

            {currentFinding.evidence && (
              <div
                className="
                  mt-4
                  rounded-2xl
                  border
                  border-amber-400/20
                  bg-amber-500/10
                  p-4
                "
              >
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-amber-200
                  "
                >
                  Evidence
                </p>

                <p
                  className="
                    mt-2
                    whitespace-pre-wrap
                    text-sm
                    leading-6
                    text-amber-50
                  "
                >
                  {currentFinding.evidence}
                </p>
              </div>
            )}


            {/* ================= Finding Information ================= */}

            <section className="mt-6">
              <h3
                className="
                  text-sm
                  font-semibold
                  text-white
                "
              >
                Finding Information
              </h3>

              <dl
                className="
                  mt-3
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >
                {informationRows.map(
                  (row) => (
                    <div
                      key={row.label}
                      className="
                        rounded-2xl
                        border
                        border-white/10
                        bg-white/2.5
                        p-3
                      "
                    >
                      <dt
                        className="
                          text-[11px]
                          uppercase
                          tracking-wider
                          text-slate-500
                        "
                      >
                        {row.label}
                      </dt>

                      <dd
                        className="
                          mt-1
                          break-all
                          text-sm
                          text-slate-200
                        "
                      >
                        {row.value}
                      </dd>
                    </div>
                  )
                )}
              </dl>
            </section>


            {/* ================= Workflow History ================= */}

            <section className="mt-6">
              <h3
                className="
                  text-sm
                  font-semibold
                  text-white
                "
              >
                Workflow History
              </h3>

              <dl
                className="
                  mt-3
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >
                {workflowRows.map(
                  (row) => (
                    <div
                      key={row.label}
                      className="
                        rounded-2xl
                        border
                        border-white/10
                        bg-white/2.5
                        p-3
                      "
                    >
                      <dt
                        className="
                          text-[11px]
                          uppercase
                          tracking-wider
                          text-slate-500
                        "
                      >
                        {row.label}
                      </dt>

                      <dd
                        className="
                          mt-1
                          text-sm
                          text-slate-200
                        "
                      >
                        {row.value}
                      </dd>
                    </div>
                  )
                )}
              </dl>
            </section>


            {/* ================= Fix Notes Input ================= */}

            {currentFinding.status ===
              "IN_PROGRESS" && (
              <section className="mt-6">
                <BmsTextarea
                  label="Fix Notes"
                  value={fixNotes}
                  placeholder="Describe the corrective work completed..."
                  onChange={(event) =>
                    setFixNotes(
                      event.target.value
                    )
                  }
                />
              </section>
            )}


            {/* ================= Existing Fix Notes ================= */}

            {currentFinding.fixNotes &&
              currentFinding.status !==
                "IN_PROGRESS" && (
                <section
                  className="
                    mt-6
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/3
                    p-4
                  "
                >
                  <p
                    className="
                      flex
                      items-center
                      gap-2
                      text-xs
                      font-bold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    <Wrench className="h-4 w-4" />

                    Fix Notes
                  </p>

                  <p
                    className="
                      mt-2
                      whitespace-pre-wrap
                      text-sm
                      leading-6
                      text-slate-200
                    "
                  >
                    {currentFinding.fixNotes}
                  </p>
                </section>
              )}


            {/* ================= Verification Input ================= */}

            {currentFinding.status ===
              "FIX_REPORTED" && (
              <section className="mt-6">
                <BmsTextarea
                  label="Verification Summary"
                  value={
                    verificationSummary
                  }
                  placeholder="Describe how the fix was verified..."
                  onChange={(event) =>
                    setVerificationSummary(
                      event.target.value
                    )
                  }
                />
              </section>
            )}


            {/* ================= Existing Verification ================= */}

            {currentFinding.verificationSummary &&
              currentFinding.status !==
                "FIX_REPORTED" && (
                <section
                  className="
                    mt-6
                    rounded-2xl
                    border
                    border-emerald-400/20
                    bg-emerald-500/10
                    p-4
                  "
                >
                  <p
                    className="
                      flex
                      items-center
                      gap-2
                      text-xs
                      font-bold
                      uppercase
                      tracking-wider
                      text-emerald-200
                    "
                  >
                    <ShieldCheck className="h-4 w-4" />

                    Verification Summary
                  </p>

                  <p
                    className="
                      mt-2
                      whitespace-pre-wrap
                      text-sm
                      leading-6
                      text-emerald-50
                    "
                  >
                    {
                      currentFinding.verificationSummary
                    }
                  </p>
                </section>
              )}


            {/* ================= Closed Message ================= */}

            {!actionLabel && (
              <div
                className="
                  mt-10
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  border-emerald-400/20
                  bg-emerald-500/10
                  p-4
                  text-sm
                  text-emerald-100
                "
              >
                <CheckCircle2 className="h-5 w-5 shrink-0" />

                <span>
                  This Continuous Commissioning finding is closed.
                </span>
              </div>
            )}


            {/* ================= Lifecycle Action ================= */}

            {actionLabel && (
              <div
                className="
                  mt-12
                  border-t
                  border-white/10
                  pt-6
                  pb-2
                "
              >
                <div className="flex justify-end">
                  <BmsButton
                    variant="primary"
                    onClick={() =>
                      void handleLifecycleAction()
                    }
                    disabled={
                      actionLoading ||
                      loading
                    }
                  >
                    {currentFinding.status ===
                      "APPROVED" && (
                      <PlayCircle className="h-4 w-4" />
                    )}

                    {currentFinding.status ===
                      "IN_PROGRESS" && (
                      <Wrench className="h-4 w-4" />
                    )}

                    {currentFinding.status ===
                      "FIX_REPORTED" && (
                      <ShieldCheck className="h-4 w-4" />
                    )}

                    {currentFinding.status ===
                      "VERIFIED" && (
                      <CheckCircle2 className="h-4 w-4" />
                    )}

                    {actionLoading
                      ? "Processing..."
                      : actionLabel}
                  </BmsButton>
                </div>
              </div>
            )}

          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}