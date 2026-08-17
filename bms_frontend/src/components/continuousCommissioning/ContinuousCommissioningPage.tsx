import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import {
  ContinuousCommissioningApi,
  type ContinuousCommissioningFindingDto,
  type ContinuousCommissioningSeverity,
  type ContinuousCommissioningStatus,
} from "@/api/continuousCommissioning";

import {
  BmsButton,
  BmsInput,
  BmsSelect,
} from "@/components/UI";

import {
  BmsApi,
  type CurrentUserDto,
} from "@/api/bms";

import {
  commissioningErrorMessage,
  formatCommissioningConfidence,
  formatCommissioningDateTime,
  formatCommissioningValue,
  humanizeCommissioningValue,
} from "./commissioningUi";

import {
  CommissioningSeverityBadge,
  CommissioningStatusBadge,
} from "./CommissioningStatusBadge";

import {
  CommissioningFindingDrawer,
} from "./CommissioningFindingDrawer";


// ============= Types =============

type ContinuousCommissioningPageProps = {
  tenantId: string;
  siteId: string;
};


type FindingFilters = {
  status: ContinuousCommissioningStatus | "ALL";
  severity: ContinuousCommissioningSeverity | "ALL";
  findingType: string;
  search: string;
};


const INITIAL_FILTERS: FindingFilters = {
  status: "ALL",
  severity: "ALL",
  findingType: "ALL",
  search: "",
};


const STATUS_OPTIONS: Array<
  ContinuousCommissioningStatus | "ALL"
> = [
  "ALL",
  "DETECTED",
  "APPROVAL_PENDING",
  "APPROVED",
  "IN_PROGRESS",
  "FIX_REPORTED",
  "VERIFIED",
  "CLOSED",
];


const SEVERITY_OPTIONS: Array<
  ContinuousCommissioningSeverity | "ALL"
> = [
  "ALL",
  "INFO",
  "WARNING",
  "CRITICAL",
];


// ============= Page =============

export function ContinuousCommissioningPage({
  tenantId,
  siteId,
}: ContinuousCommissioningPageProps) {
  const [findings, setFindings] = useState<
    ContinuousCommissioningFindingDto[]
  >([]);

  const [selectedFinding, setSelectedFinding] =
    useState<ContinuousCommissioningFindingDto | null>(null);

  const [currentUser, setCurrentUser] =
    useState<CurrentUserDto | null>(null);

  const [filters, setFilters] =
    useState<FindingFilters>(INITIAL_FILTERS);

  const [loading, setLoading] = useState(true);

  const [evaluating, setEvaluating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);


  // ============= Current User =============

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const user =
          await BmsApi.getCurrentUser();

        if (!cancelled) {
          setCurrentUser(user);
        }
      } catch (requestError) {
        console.error(
          "Failed to load current user for Continuous Commissioning",
          requestError
        );

        if (!cancelled) {
          setCurrentUser(null);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);


  // ============= Findings =============

  const loadFindings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result =
        await ContinuousCommissioningApi.getFindings(
          tenantId,
          siteId
        );

      setFindings(
        Array.isArray(result)
          ? result
          : []
      );
    } catch (requestError) {
      setFindings([]);

      setError(
        commissioningErrorMessage(requestError)
      );
    } finally {
      setLoading(false);
    }
  }, [tenantId, siteId]);


  useEffect(() => {
    void loadFindings();
  }, [loadFindings]);


  // ============= Evaluation =============

  async function handleEvaluateSite() {
    try {
      setEvaluating(true);
      setError(null);
      setSuccessMessage(null);

      const result =
        await ContinuousCommissioningApi.evaluateSite(
          tenantId,
          siteId
        );

      const created =
        result.findingsCreated;

      const updated =
        result.findingsUpdated;

      if (
        created !== undefined ||
        updated !== undefined
      ) {
        setSuccessMessage(
          `Evaluation completed. ${
            created ?? 0
          } finding(s) created and ${
            updated ?? 0
          } finding(s) updated.`
        );
      } else {
        setSuccessMessage(
          result.message ||
            "Continuous Commissioning evaluation completed."
        );
      }

      await loadFindings();
    } catch (requestError) {
      setError(
        commissioningErrorMessage(requestError)
      );
    } finally {
      setEvaluating(false);
    }
  }


  // ============= Finding Types =============

  const findingTypes = useMemo(() => {
    const values = new Set<string>();

    findings.forEach((finding) => {
      const findingType =
        finding.findingType?.trim();

      if (findingType) {
        values.add(findingType);
      }
    });

    return Array.from(values).sort();
  }, [findings]);


  // ============= Filtered Findings =============

  const visibleFindings = useMemo(() => {
    const searchValue =
      filters.search.trim().toLowerCase();

    return findings.filter((finding) => {
      if (
        filters.status !== "ALL" &&
        finding.status !== filters.status
      ) {
        return false;
      }

      if (
        filters.severity !== "ALL" &&
        finding.severity !== filters.severity
      ) {
        return false;
      }

      if (
        filters.findingType !== "ALL" &&
        finding.findingType !== filters.findingType
      ) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const searchableValues = [
        finding.title,
        finding.summary,
        finding.description,
        finding.findingType,
        finding.hvacId,
        finding.externalDeviceId,
        finding.detectedValue,
        finding.expectedValue,
        finding.recommendation,
      ];

      return searchableValues.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(searchValue)
      );
    });
  }, [
    findings,
    filters.status,
    filters.severity,
    filters.findingType,
    filters.search,
  ]);


  // ============= KPI Counts =============

  const counts = useMemo(() => {
    return {
      open: findings.filter(
        (finding) =>
          finding.status !== "CLOSED"
      ).length,

      critical: findings.filter(
        (finding) =>
          finding.status !== "CLOSED" &&
          finding.severity === "CRITICAL"
      ).length,

      awaitingApproval: findings.filter(
        (finding) =>
          finding.status ===
          "APPROVAL_PENDING"
      ).length,

      inProgress: findings.filter(
        (finding) =>
          finding.status === "IN_PROGRESS"
      ).length,

      awaitingVerification:
        findings.filter(
          (finding) =>
            finding.status ===
            "FIX_REPORTED"
        ).length,

      closed: findings.filter(
        (finding) =>
          finding.status === "CLOSED"
      ).length,
    };
  }, [findings]);


  // ============= Drawer =============

  function openFinding(
    finding: ContinuousCommissioningFindingDto
  ) {
    setSelectedFinding(finding);
  }


  function closeFinding() {
    setSelectedFinding(null);
  }


  function handleFindingUpdated(
    updatedFinding: ContinuousCommissioningFindingDto
  ) {
    setFindings((previous) =>
      previous.map((finding) =>
        finding.findingId ===
        updatedFinding.findingId
          ? updatedFinding
          : finding
      )
    );

    setSelectedFinding(updatedFinding);
  }


  // ============= Render =============

  return (
    <div
      className="
        bms-dashboard-bg
        bms-dashboard-shell
        mx-auto
        w-full
        max-w-7xl
        space-y-6
      "
    >
      {/* ================= Hero ================= */}

      <section className="bms-dashboard-hero">
        <div className="bms-dashboard-hero-content">
          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div className="min-w-0">
              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-cyan-300
                "
              >
                <Sparkles className="h-4 w-4" />

                Continuous Commissioning
              </div>

              <h1
                className="
                  mt-3
                  text-3xl
                  font-bold
                  text-slate-100
                "
              >
                Continuous Commissioning
                Findings
              </h1>

              <p
                className="
                  mt-2
                  max-w-3xl
                  text-sm
                  leading-6
                  text-slate-400
                "
              >
                Detect operational inefficiencies,
                review recommendations and manage the
                complete commissioning lifecycle from
                detection through verification and
                closure.
              </p>

              <p
                className="
                  mt-3
                  break-all
                  text-xs
                  text-slate-500
                "
              >
                Tenant:{" "}
                <span className="text-slate-300">
                  {tenantId}
                </span>

                <span className="mx-2">•</span>

                Site:{" "}
                <span className="text-slate-300">
                  {siteId}
                </span>
              </p>
            </div>

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-3
              "
            >
              <BmsButton
                variant="secondary"
                onClick={() =>
                  void loadFindings()
                }
                disabled={
                  loading ||
                  evaluating
                }
              >
                <RefreshCw
                  className={[
                    "h-4 w-4",
                    loading
                      ? "animate-spin"
                      : "",
                  ].join(" ")}
                />

                Refresh
              </BmsButton>

              <BmsButton
                variant="primary"
                onClick={() =>
                  void handleEvaluateSite()
                }
                disabled={
                  evaluating ||
                  loading
                }
              >
                <Sparkles
                  className={[
                    "h-4 w-4",
                    evaluating
                      ? "animate-pulse"
                      : "",
                  ].join(" ")}
                />

                {evaluating
                  ? "Evaluating..."
                  : "Evaluate Site"}
              </BmsButton>
            </div>
          </div>
        </div>
      </section>


      {/* ================= KPI Cards ================= */}

      <div
        className="
          grid
          gap-4
          sm:grid-cols-2
          xl:grid-cols-6
        "
      >
        <CommissioningStatCard
          icon={
            <AlertTriangle className="h-5 w-5" />
          }
          label="Open Findings"
          value={counts.open}
        />

        <CommissioningStatCard
          icon={
            <AlertTriangle className="h-5 w-5" />
          }
          label="Critical"
          value={counts.critical}
        />

        <CommissioningStatCard
          icon={
            <ClipboardCheck className="h-5 w-5" />
          }
          label="Awaiting Approval"
          value={counts.awaitingApproval}
        />

        <CommissioningStatCard
          icon={
            <PlayCircle className="h-5 w-5" />
          }
          label="In Progress"
          value={counts.inProgress}
        />

        <CommissioningStatCard
          icon={
            <ShieldCheck className="h-5 w-5" />
          }
          label="Awaiting Verify"
          value={
            counts.awaitingVerification
          }
        />

        <CommissioningStatCard
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
          label="Closed"
          value={counts.closed}
        />
      </div>


      {/* ================= Messages ================= */}

      {error && (
        <div
          className="
            rounded-2xl
            border border-rose-400/30
            bg-rose-950/30
            p-4
            text-sm
            text-rose-100
          "
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          className="
            rounded-2xl
            border border-emerald-400/20
            bg-emerald-500/10
            p-4
            text-sm
            text-emerald-100
          "
        >
          {successMessage}
        </div>
      )}


      {/* ================= Filters ================= */}

      <section className="bms-section">
        <div
          className="
            grid
            gap-4
            md:grid-cols-2
            xl:grid-cols-4
          "
        >
          <BmsSelect
            label="Status"
            value={filters.status}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                status:
                  event.target.value as FindingFilters["status"],
              }))
            }
          >
            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status === "ALL"
                    ? "All Statuses"
                    : humanizeCommissioningValue(
                        status
                      )}
                </option>
              )
            )}
          </BmsSelect>

          <BmsSelect
            label="Severity"
            value={filters.severity}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                severity:
                  event.target.value as FindingFilters["severity"],
              }))
            }
          >
            {SEVERITY_OPTIONS.map(
              (severity) => (
                <option
                  key={severity}
                  value={severity}
                >
                  {severity === "ALL"
                    ? "All Severities"
                    : humanizeCommissioningValue(
                        severity
                      )}
                </option>
              )
            )}
          </BmsSelect>

          <BmsSelect
            label="Finding Type"
            value={filters.findingType}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                findingType:
                  event.target.value,
              }))
            }
          >
            <option value="ALL">
              All Finding Types
            </option>

            {findingTypes.map(
              (findingType) => (
                <option
                  key={findingType}
                  value={findingType}
                >
                  {humanizeCommissioningValue(
                    findingType
                  )}
                </option>
              )
            )}
          </BmsSelect>

          <BmsInput
            label="Search"
            value={filters.search}
            placeholder="HVAC, device, finding..."
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                search:
                  event.target.value,
              }))
            }
          />
        </div>

        <div
          className="
            mt-4
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
              text-xs
              text-slate-500
            "
          >
            <Search className="h-3.5 w-3.5" />

            Showing{" "}
            {visibleFindings.length} of{" "}
            {findings.length} findings
          </div>

          <button
            type="button"
            onClick={() =>
              setFilters(INITIAL_FILTERS)
            }
            className="
              text-xs
              font-medium
              text-cyan-300
              transition
              hover:text-cyan-200
            "
          >
            Clear filters
          </button>
        </div>
      </section>


      {/* ================= Table ================= */}

      <section
        className="
          bms-section
          overflow-hidden
        "
      >
        {loading ? (
          <div
            className="
              p-10
              text-center
              text-sm
              text-slate-300
            "
          >
            Loading Continuous
            Commissioning findings...
          </div>
        ) : visibleFindings.length === 0 ? (
          <div
            className="
              p-10
              text-center
            "
          >
            <Sparkles
              className="
                mx-auto
                h-9
                w-9
                text-slate-600
              "
            />

            <p
              className="
                mt-4
                font-medium
                text-slate-300
              "
            >
              No findings found.
            </p>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              Run a site evaluation or change
              the current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="
                min-w-full
                divide-y
                divide-white/10
                text-sm
              "
            >
              <thead
                className="
                  bg-white/5
                  text-left
                  text-xs
                  uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                <tr>
                  <th className="px-4 py-3">
                    Status
                  </th>

                  <th className="px-4 py-3">
                    Severity
                  </th>

                  <th className="px-4 py-3">
                    Finding
                  </th>

                  <th className="px-4 py-3">
                    HVAC / Device
                  </th>

                  <th className="px-4 py-3">
                    Detected
                  </th>

                  <th className="px-4 py-3">
                    Expected
                  </th>

                  <th className="px-4 py-3">
                    Confidence
                  </th>

                  <th className="px-4 py-3">
                    Detected At
                  </th>

                  <th className="px-4 py-3">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody
                className="
                  divide-y
                  divide-white/10
                  text-slate-200
                "
              >
                {visibleFindings.map(
                  (finding) => (
                    <tr
                      key={finding.findingId}
                      className="
                        transition
                        hover:bg-white/3
                      "
                    >
                      <td className="px-4 py-4">
                        <CommissioningStatusBadge
                          status={
                            finding.status
                          }
                        />
                      </td>

                      <td className="px-4 py-4">
                        <CommissioningSeverityBadge
                          severity={
                            finding.severity
                          }
                        />
                      </td>

                      <td
                        className="
                          min-w-55
                          px-4
                          py-4
                        "
                      >
                        <div
                          className="
                            font-semibold
                            text-white
                          "
                        >
                          {finding.title ||
                            humanizeCommissioningValue(
                              finding.findingType
                            )}
                        </div>

                        {finding.summary && (
                          <div
                            className="
                              mt-1
                              max-w-sm
                              truncate
                              text-xs
                              text-slate-500
                            "
                          >
                            {finding.summary}
                          </div>
                        )}

                        <div
                          className="
                            mt-1
                            text-[11px]
                            uppercase
                            tracking-wider
                            text-slate-600
                          "
                        >
                          {humanizeCommissioningValue(
                            finding.findingType
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div
                          className="
                            text-xs
                            font-medium
                            text-slate-200
                          "
                        >
                          {formatCommissioningValue(
                            finding.externalDeviceId
                          )}
                        </div>

                        <div
                          className="
                            mt-1
                            max-w-45
                            truncate
                            font-mono
                            text-[11px]
                            text-slate-500
                          "
                        >
                          {formatCommissioningValue(
                            finding.hvacId
                          )}
                        </div>
                      </td>

                      <td
                        className="
                          px-4
                          py-4
                          font-mono
                          text-xs
                        "
                      >
                        {formatCommissioningValue(
                          finding.detectedValue
                        )}
                      </td>

                      <td
                        className="
                          px-4
                          py-4
                          font-mono
                          text-xs
                        "
                      >
                        {formatCommissioningValue(
                          finding.expectedValue
                        )}
                      </td>

                      <td
                        className="
                          px-4
                          py-4
                          font-semibold
                          text-cyan-200
                        "
                      >
                        {formatCommissioningConfidence(
                          finding.confidence
                        )}
                      </td>

                      <td
                        className="
                          min-w-37.5
                          px-4
                          py-4
                          text-xs
                          text-slate-400
                        "
                      >
                        {formatCommissioningDateTime(
                          finding.detectedAt
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            openFinding(
                              finding
                            )
                          }
                          className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-white/10
                            bg-white/3
                            px-3
                            py-2
                            text-xs
                            font-semibold
                            text-slate-200
                            transition
                            hover:bg-white/10
                            hover:text-white
                          "
                        >
                          <Eye className="h-3.5 w-3.5" />

                          Details
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>


      {/* ================= Workflow Guide ================= */}

      <section className="bms-section">
        <div
          className="
            flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-white
          "
        >
          <Wrench className="h-4 w-4 text-cyan-300" />

          Commissioning Lifecycle
        </div>

        <div
          className="
            mt-4
            flex
            flex-wrap
            items-center
            gap-2
            text-xs
            text-slate-400
          "
        >
          <LifecycleStep label="Detected" />

          <LifecycleArrow />

          <LifecycleStep label="Approval Pending" />

          <LifecycleArrow />

          <LifecycleStep label="Approved" />

          <LifecycleArrow />

          <LifecycleStep label="In Progress" />

          <LifecycleArrow />

          <LifecycleStep label="Fix Reported" />

          <LifecycleArrow />

          <LifecycleStep label="Verified" />

          <LifecycleArrow />

          <LifecycleStep label="Closed" />
        </div>
      </section>


      {/* ================= Drawer ================= */}

      <CommissioningFindingDrawer
        open={
          selectedFinding !== null
        }
        tenantId={tenantId}
        siteId={siteId}
        finding={selectedFinding}
        currentUserId={
          currentUser?.keycloakUserId
        }
        onClose={closeFinding}
        onUpdated={
          handleFindingUpdated
        }
      />
    </div>
  );
}


// ============= KPI Card =============

function CommissioningStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bms-section">
      <div
        className="
          flex
          items-center
          gap-3
          text-cyan-200
        "
      >
        {icon}

        <span
          className="
            text-[11px]
            font-semibold
            uppercase
            tracking-wider
            text-slate-400
          "
        >
          {label}
        </span>
      </div>

      <div
        className="
          mt-3
          text-3xl
          font-black
          text-white
        "
      >
        {value}
      </div>
    </div>
  );
}


// ============= Lifecycle UI =============

function LifecycleStep({
  label,
}: {
  label: string;
}) {
  return (
    <span
      className="
        rounded-full
        border border-white/10
        bg-white/3
        px-3
        py-1.5
        font-medium
        text-slate-300
      "
    >
      {label}
    </span>
  );
}


function LifecycleArrow() {
  return (
    <span
      className="
        text-slate-600
      "
    >
      →
    </span>
  );
}