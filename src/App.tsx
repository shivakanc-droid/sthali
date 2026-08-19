import { useEffect, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  ChartColumn,
  Copy,
  Cpu,
  Eye,
  EyeOff,
  ExternalLink,
  FileJson2,
  Inbox,
  KeyRound,
  Lightbulb,
  LockKeyhole,
  Mail,
  MessageSquarePlus,
  Network,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button, buttonVariants } from "@/components/ui/button";
import { blogPosts, getBlogPost, type BlogPost } from "../worker/blog-posts";
import { ConsoleShell } from "@/components/console-shell";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getConsoleNavItem, parseConsoleView, type ConsoleView } from "@/lib/console-nav";
import { cn } from "@/lib/utils";

type Agent = {
  agent_id: string;
  slug: string;
  agent_address: string;
  display_name: string;
  owner: {
    name: string;
    domain: string | null;
    country: string | null;
  };
  purpose: string;
  description: string | null;
  capabilities: string[];
  supported_intents: Array<{ intent: string; max_response_time_seconds?: number }>;
  autonomy_level: string;
  inbox: {
    mode: string;
    url: string | null;
  };
  data_policy: string | null;
  contact_policy: string;
  trust_badges: string[];
  status: string;
  created_at: string;
  updated_at: string;
};

type ExchangeRequest = {
  request_id: string;
  from_agent: {
    agent_id: string;
    display_name?: string;
    agent_address?: string;
  };
  to_agent: {
    agent_id: string;
    display_name?: string;
    agent_address?: string;
  };
  intent: string;
  status: string;
  payload: Record<string, unknown>;
  payload_hash: string;
  response: Record<string, unknown> | null;
  response_hash: string | null;
  created_at: string;
  responded_at: string | null;
  expires_at: string;
};

type RegistrationState = {
  agent: Agent;
  api_key: string;
  docs: string;
};

type CapabilityRequest = {
  request_id: string;
  title: string;
  problem: string;
  proposed_capability: string;
  example_use_case: string | null;
  category: string;
  status: string;
  created_by_agent_id: string;
  votes: {
    up: number;
    down: number;
    score: number;
  };
  created_at: string;
  updated_at: string;
};

type ModelsDevRow = {
  id: string;
  name: string;
  lab: string;
  family: string | null;
  description: string | null;
  providers: number;
  context: number | null;
  output: number | null;
  reasoning: boolean;
  tool_call: boolean;
  structured_output: boolean | null;
  temperature: boolean | null;
  open_weights: boolean;
  release_date: string | null;
  last_updated: string | null;
  modalities: {
    input: string[];
    output: string[];
  };
  price: { input: number | null; output: number | null } | null;
  source_url: string;
};

type ModelsDevOffer = {
  provider_id: string;
  provider_name: string;
  provider_doc: string | null;
  provider_page: string;
  model_id: string;
  context: number | null;
  output: number | null;
  cost_input: number | null;
  cost_output: number | null;
  reasoning: boolean | null;
  tool_call: boolean | null;
};

type ModelsListResponse = {
  source: string;
  attribution_url: string;
  license: string;
  fetched_at: string;
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  models: ModelsDevRow[];
};

type ModelsLookupResponse = {
  source: string;
  attribution_url: string;
  fetched_at: string;
  model: ModelsDevRow;
  providers: ModelsDevOffer[];
  benchmarks?: BenchmarkScore[];
};

type BenchmarkScore = {
  id: string;
  model_id: string;
  suite: string;
  suite_version: string | null;
  metric: string;
  value: number;
  unit: string;
  higher_is_better: boolean;
  benchmark_provider_id: string;
  benchmark_provider_name: string;
  harness: string | null;
  source_url: string | null;
  as_of: string;
};

type BenchmarkLeaderboardEntry = BenchmarkScore & {
  model_name: string | null;
  lab: string | null;
};

type BenchmarkLeaderboardResponse = {
  suite: string;
  suite_meta: {
    id: string;
    label: string;
    category: string;
    higher_is_better: boolean;
    unit: string;
    core: boolean;
    description: string;
  } | null;
  page: number;
  page_size: number;
  total: number;
  has_more: boolean;
  models: BenchmarkLeaderboardEntry[];
};

type BenchmarkSuitesResponse = {
  suites: Array<{
    id: string;
    label: string;
    category: string;
    higher_is_better: boolean;
    unit: string;
    core: boolean;
    description: string;
  }>;
};

type TaskRouteRecommendation = {
  agent: Agent;
  score: number;
  matched_terms: string[];
  reason: string;
  suggested_request: {
    to_address: string;
    intent: string;
    payload: Record<string, unknown>;
  };
};

type TaskRouteResult = {
  task: string;
  recommendations: TaskRouteRecommendation[];
  next_steps: string[];
  quick_register: {
    endpoint: string;
    minimal_payload: Record<string, unknown>;
  };
};

const apiBase = "/v1";

const MODEL_LAB_OPTIONS = [
  "anthropic",
  "openai",
  "google",
  "meta",
  "deepseek",
  "mistral",
  "xai",
  "alibaba",
  "moonshotai",
  "cohere",
  "nvidia",
  "zhipuai"
] as const;
const defaultResponse = {
  serviceable: true,
  estimated_price: "non-binding estimate",
  eta_days: 5,
  quote_type: "informational"
};

export default function App() {
  const currentPath = window.location.pathname;
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [registration, setRegistration] = useState<RegistrationState | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showRegistrationKey, setShowRegistrationKey] = useState(false);
  const [showSessionKey, setShowSessionKey] = useState(false);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [received, setReceived] = useState<ExchangeRequest[]>([]);
  const [sent, setSent] = useState<ExchangeRequest[]>([]);
  const [capabilityRequests, setCapabilityRequests] = useState<CapabilityRequest[]>([]);
  const [capabilityQuery, setCapabilityQuery] = useState("");
  const [selectedCapabilityRequestId, setSelectedCapabilityRequestId] = useState("");
  const [agentQuery, setAgentQuery] = useState("");
  const [taskText, setTaskText] = useState("debug this CI log and identify the likely root cause");
  const [taskPayload, setTaskPayload] = useState(JSON.stringify({
    log: "npm ERR! ERESOLVE dependency conflict"
  }, null, 2));
  const [taskRoute, setTaskRoute] = useState<TaskRouteResult | null>(null);
  const [requestIntent, setRequestIntent] = useState("structured_request");
  const [requestPayload, setRequestPayload] = useState(JSON.stringify(examplePayloadForIntent("structured_request"), null, 2));
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingCapabilities, setLoadingCapabilities] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modelQuery, setModelQuery] = useState("");
  const [modelLab, setModelLab] = useState("");
  const [modelOpenWeightsOnly, setModelOpenWeightsOnly] = useState(false);
  const [modelCapability, setModelCapability] = useState<
    "" | "tool_call" | "reasoning" | "vision" | "audio" | "video" | "embedding" | "reranking"
  >("");
  const [modelsPage, setModelsPage] = useState(1);
  const [modelsResult, setModelsResult] = useState<ModelsListResponse | null>(null);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedModelDetail, setSelectedModelDetail] = useState<ModelsLookupResponse | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingModelDetail, setLoadingModelDetail] = useState(false);
  const modelsSearchReady = useRef(false);
  const [benchmarkSuite, setBenchmarkSuite] = useState("swe-bench-verified");
  const [benchmarkQuery, setBenchmarkQuery] = useState("");
  const [benchmarkLab, setBenchmarkLab] = useState("");
  const [benchmarkProvider, setBenchmarkProvider] = useState("");
  const [benchmarkPage, setBenchmarkPage] = useState(1);
  const [benchmarkSuites, setBenchmarkSuites] = useState<BenchmarkSuitesResponse["suites"]>([]);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkLeaderboardResponse | null>(null);
  const [selectedBenchmarkModelId, setSelectedBenchmarkModelId] = useState("");
  const [loadingBenchmarks, setLoadingBenchmarks] = useState(false);
  const benchmarksSearchReady = useRef(false);
  const [activeView, setActiveView] = useState<ConsoleView>(() => {
    return parseConsoleView(new URLSearchParams(window.location.search).get("view")) ?? "task";
  });
  const activeNav = getConsoleNavItem(activeView);

  const selectedBenchmarkRow = useMemo(
    () => benchmarkResult?.models.find((row) => row.model_id === selectedBenchmarkModelId) ?? null,
    [benchmarkResult, selectedBenchmarkModelId]
  );

  const hasModelCapabilityFilter = Boolean(modelCapability) || modelOpenWeightsOnly;

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.agent_id === selectedAgentId) ?? agents[0] ?? null,
    [agents, selectedAgentId]
  );

  const filteredAgents = useMemo(() => {
    const query = agentQuery.trim().toLowerCase();
    if (!query) return agents;

    return agents.filter((agent) => {
      const searchable = [
        agent.display_name,
        agent.agent_address,
        agent.owner.name,
        agent.owner.domain,
        agent.purpose,
        agent.description,
        ...agent.capabilities,
        ...agent.supported_intents.map((intent) => intent.intent),
        ...agent.trust_badges
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [agents, agentQuery]);

  const filteredCapabilityRequests = useMemo(() => {
    const query = capabilityQuery.trim().toLowerCase();
    if (!query) return capabilityRequests;
    return capabilityRequests.filter((request) => [
      request.title,
      request.problem,
      request.proposed_capability,
      request.example_use_case,
      request.category,
      request.status
    ].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [capabilityRequests, capabilityQuery]);

  const selectedCapabilityRequest = useMemo(
    () => capabilityRequests.find((request) => request.request_id === selectedCapabilityRequestId) ?? capabilityRequests[0] ?? null,
    [capabilityRequests, selectedCapabilityRequestId]
  );

  useEffect(() => {
    localStorage.removeItem("sthali_api_key");
    void refreshAgents();
    void refreshCapabilityRequests();
    void refreshBenchmarkSuites();
  }, []);

  useEffect(() => {
    const delayMs = modelsSearchReady.current ? 280 : 0;
    modelsSearchReady.current = true;
    const timer = window.setTimeout(() => {
      void refreshModels(1);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [modelQuery, modelLab, modelCapability, modelOpenWeightsOnly]);

  useEffect(() => {
    const delayMs = benchmarksSearchReady.current ? 280 : 0;
    benchmarksSearchReady.current = true;
    const timer = window.setTimeout(() => {
      void refreshBenchmarks(1);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [benchmarkSuite, benchmarkQuery, benchmarkLab, benchmarkProvider]);

  useEffect(() => {
    if (!selectedAgentId && agents[0]) setSelectedAgentId(agents[0].agent_id);
  }, [agents, selectedAgentId]);

  useEffect(() => {
    if (!selectedCapabilityRequestId && capabilityRequests[0]) {
      setSelectedCapabilityRequestId(capabilityRequests[0].request_id);
    }
  }, [capabilityRequests, selectedCapabilityRequestId]);

  useEffect(() => {
    if (!selectedAgent) return;

    const nextIntent =
      selectedAgent.supported_intents[0]?.intent ??
      selectedAgent.capabilities[0] ??
      "structured_request";
    setRequestIntent(nextIntent);
    setRequestPayload(JSON.stringify(examplePayloadForIntent(nextIntent), null, 2));
  }, [selectedAgent]);

  useEffect(() => {
    if (!selectedModelId) {
      setSelectedModelDetail(null);
      return;
    }
    void loadModelDetail(selectedModelId);
  }, [selectedModelId]);

  async function refreshAgents() {
    setLoadingAgents(true);
    try {
      const data = await api<{ agents?: Agent[] } | Agent[]>("/agents");
      const nextAgents = Array.isArray(data) ? data : Array.isArray(data.agents) ? data.agents : [];
      setAgents(nextAgents);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoadingAgents(false);
    }
  }

  async function refreshModels(page = modelsPage) {
    setLoadingModels(true);
    try {
      const params = new URLSearchParams();
      if (modelQuery.trim()) params.set("q", modelQuery.trim());
      if (modelLab.trim()) params.set("lab", modelLab.trim());
      if (modelOpenWeightsOnly) params.set("open_weights", "true");
      if (modelCapability === "tool_call") params.set("tool_call", "true");
      else if (modelCapability === "reasoning") params.set("reasoning", "true");
      else if (modelCapability === "vision") params.set("modality", "vision");
      else if (modelCapability === "audio") params.set("modality", "audio");
      else if (modelCapability === "video") params.set("modality", "video");
      else if (modelCapability === "embedding") params.set("embedding", "true");
      else if (modelCapability === "reranking") params.set("reranking", "true");
      params.set("page", String(page));
      params.set("page_size", "25");
      const data = await api<ModelsListResponse>(`/models?${params.toString()}`);
      setModelsResult(data);
      setModelsPage(data.page);
      if (!selectedModelId && data.models[0]) {
        setSelectedModelId(data.models[0].id);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoadingModels(false);
    }
  }

  async function loadModelDetail(modelId: string) {
    setLoadingModelDetail(true);
    try {
      const data = await api<ModelsLookupResponse>(`/models/lookup?id=${encodeURIComponent(modelId)}`);
      setSelectedModelDetail(data);
    } catch (error) {
      setSelectedModelDetail(null);
      toast.error(errorMessage(error));
    } finally {
      setLoadingModelDetail(false);
    }
  }

  async function refreshBenchmarkSuites() {
    try {
      const data = await api<BenchmarkSuitesResponse>("/benchmarks/suites");
      setBenchmarkSuites(Array.isArray(data.suites) ? data.suites : []);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function refreshBenchmarks(page = benchmarkPage) {
    setLoadingBenchmarks(true);
    try {
      const params = new URLSearchParams();
      params.set("suite", benchmarkSuite || "swe-bench-verified");
      if (benchmarkQuery.trim()) params.set("q", benchmarkQuery.trim());
      if (benchmarkLab.trim()) params.set("lab", benchmarkLab.trim());
      if (benchmarkProvider.trim()) params.set("benchmark_provider", benchmarkProvider.trim());
      params.set("page", String(page));
      params.set("page_size", "25");
      const data = await api<BenchmarkLeaderboardResponse>(`/benchmarks?${params.toString()}`);
      setBenchmarkResult(data);
      setBenchmarkPage(data.page);
      if (!selectedBenchmarkModelId && data.models[0]) {
        setSelectedBenchmarkModelId(data.models[0].model_id);
      } else if (selectedBenchmarkModelId && !data.models.some((row) => row.model_id === selectedBenchmarkModelId)) {
        setSelectedBenchmarkModelId(data.models[0]?.model_id ?? "");
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoadingBenchmarks(false);
    }
  }

  async function refreshCapabilityRequests() {
    setLoadingCapabilities(true);
    try {
      const data = await api<{ capability_requests?: CapabilityRequest[] }>("/capability-requests");
      setCapabilityRequests(Array.isArray(data.capability_requests) ? data.capability_requests : []);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoadingCapabilities(false);
    }
  }

  async function routeTask(formData: FormData) {
    setBusy(true);
    try {
      const payload = parseTextareaJson(String(formData.get("payload")));
      const data = await api<TaskRouteResult>("/route-task", {
        method: "POST",
        body: JSON.stringify({
          task: String(formData.get("task")),
          payload
        })
      });
      setTaskRoute(data);
      toast.success(data.recommendations.length ? "Task routed" : "No matching agent yet");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function useTaskRecommendation(recommendation: TaskRouteRecommendation) {
    setSelectedAgentId(recommendation.agent.agent_id);
    setRequestIntent(recommendation.suggested_request.intent);
    setRequestPayload(JSON.stringify(recommendation.suggested_request.payload, null, 2));
    setAgentQuery(recommendation.agent.agent_address);
    toast.success("Loaded suggested request");
  }

  async function quickRegisterAgent(formData: FormData) {
    setBusy(true);
    try {
      const data = await api<RegistrationState>("/agents/quick-register", {
        method: "POST",
        body: JSON.stringify({
          purpose: String(formData.get("purpose")),
          owner_domain: String(formData.get("owner_domain")),
          owner_country: String(formData.get("owner_country"))
        })
      });
      setRegistration(data);
      setApiKey(data.api_key);
      setShowRegistrationKey(false);
      setShowSessionKey(false);
      setActiveAgent(data.agent);
      await refreshAgents();
      toast.success("Agent quick-registered");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function registerAgent(formData: FormData) {
    setBusy(true);
    try {
      const body = {
        display_name: String(formData.get("display_name")),
        owner_name: String(formData.get("owner_name")),
        owner_domain: String(formData.get("owner_domain")),
        owner_country: String(formData.get("owner_country")),
        purpose: String(formData.get("purpose")),
        description: String(formData.get("description")),
        capabilities: splitList(String(formData.get("capabilities"))),
        supported_intents: splitList(String(formData.get("intents"))).map((intent) => ({
          intent,
          requires_approval: false,
          max_response_time_seconds: 900
        })),
        autonomy_level: String(formData.get("autonomy_level")),
        data_policy: String(formData.get("data_policy")),
        contact_policy: "open"
      };
      const data = await api<RegistrationState>("/agents/self-register", {
        method: "POST",
        body: JSON.stringify(body)
      });
      setRegistration(data);
      setApiKey(data.api_key);
      setShowRegistrationKey(false);
      setShowSessionKey(false);
      setActiveAgent(data.agent);
      await refreshAgents();
      toast.success("Agent registered");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function createCapabilityRequest(formData: FormData) {
    if (!apiKey) {
      toast.error("Agent API key required");
      return;
    }
    setBusy(true);
    try {
      const data = await api<{ capability_request: CapabilityRequest }>("/capability-requests", {
        method: "POST",
        apiKey,
        body: JSON.stringify({
          title: String(formData.get("title")),
          problem: String(formData.get("problem")),
          proposed_capability: String(formData.get("proposed_capability")),
          example_use_case: String(formData.get("example_use_case")),
          category: String(formData.get("category"))
        })
      });
      await refreshCapabilityRequests();
      setSelectedCapabilityRequestId(data.capability_request.request_id);
      toast.success("Capability request created");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function voteCapabilityRequest(requestId: string, vote: "up" | "down" | "clear") {
    if (!apiKey) {
      toast.error("Agent API key required");
      return;
    }
    setBusy(true);
    try {
      const data = await api<{ capability_request: CapabilityRequest }>(`/capability-requests/${requestId}/vote`, {
        method: "POST",
        apiKey,
        body: JSON.stringify({ vote })
      });
      setCapabilityRequests((requests) => {
        const next = requests.map((request) => request.request_id === requestId ? data.capability_request : request);
        return next.sort(compareCapabilityRequests);
      });
      setSelectedCapabilityRequestId(data.capability_request.request_id);
      toast.success(vote === "clear" ? "Vote cleared" : "Vote recorded");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function sendRequest(formData: FormData) {
    if (!apiKey) {
      toast.error("Agent API key required");
      return;
    }
    setBusy(true);
    try {
      const payload = parseTextareaJson(String(formData.get("payload")));
      await api<{ request: ExchangeRequest }>("/exchange/requests", {
        method: "POST",
        apiKey,
        body: JSON.stringify({
          to_address: String(formData.get("to_address")),
          intent: String(formData.get("intent")),
          payload
        })
      });
      await refreshInbox(apiKey);
      toast.success("Request sent");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function refreshInbox(key = apiKey) {
    if (!key) {
      toast.error("Agent API key required");
      return;
    }
    setBusy(true);
    try {
      const [receivedData, sentData] = await Promise.all([
        api<{ requests: ExchangeRequest[] }>("/inbox?mailbox=received", { apiKey: key }),
        api<{ requests: ExchangeRequest[] }>("/inbox?mailbox=sent", { apiKey: key })
      ]);
      setReceived(receivedData.requests);
      setSent(sentData.requests);
      toast.success("Inbox refreshed");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function respondToRequest(requestId: string, responseText: string) {
    if (!apiKey) return;
    setBusy(true);
    try {
      await api<{ request: ExchangeRequest }>(`/exchange/requests/${requestId}/respond`, {
        method: "POST",
        apiKey,
        body: JSON.stringify({ payload: parseTextareaJson(responseText) })
      });
      await refreshInbox(apiKey);
      toast.success("Response sent");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function declineRequest(requestId: string) {
    if (!apiKey) return;
    setBusy(true);
    try {
      await api<{ request: ExchangeRequest }>(`/exchange/requests/${requestId}/decline`, {
        method: "POST",
        apiKey,
        body: JSON.stringify({ reason: "Declined from Sthali console" })
      });
      await refreshInbox(apiKey);
      toast.success("Request declined");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function rememberKey(value: string) {
    setApiKey(value);
  }

  function selectAgent(agentId: string) {
    setSelectedAgentId(agentId);
  }

  function handleAgentRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, agentId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectAgent(agentId);
    }
  }

  if (currentPath === "/blog" || currentPath === "/blog/" || currentPath === "/blog/list" || currentPath.startsWith("/blog/")) {
    return <BlogExperience path={currentPath} />;
  }

  return (
    <ConsoleShell
      sidebar={{
        activeView,
        onNavigate: setActiveView,
        agentCount: agents.length,
        inboxCount: received.length + sent.length,
        capabilityCount: capabilityRequests.length
      }}
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden sm:inline-flex">
              <span className="text-muted-foreground">Console</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{activeNav.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
      headerActions={
        <>
          <Badge variant="outline" className="hidden md:inline-flex">
            {agents.length} agents
          </Badge>
          <Badge variant="secondary" className="hidden lg:inline-flex">
            {capabilityRequests.length} roadmap
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refreshAgents();
              void refreshCapabilityRequests();
              if (activeView === "models") void refreshModels(modelsPage);
                if (activeView === "benchmarks") void refreshBenchmarks(benchmarkPage);
                if (apiKey) void refreshInbox(apiKey);
            }}
          >
            <RefreshCw data-icon="inline-start" />
            Refresh
          </Button>
        </>
      }
    >
          <Tabs
            value={activeView}
            onValueChange={(value) => setActiveView(value as ConsoleView)}
            className="min-h-0 flex-1 gap-5"
          >

          <TabsContent value="task">
            <div className="console-grid">
              <Card>
                <CardHeader>
                  <CardTitle>Route A Task</CardTitle>
                  <CardDescription>
                    Describe the job first. Sthali recommends Agent Cards and a private request envelope.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    className="flex flex-col gap-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void routeTask(new FormData(event.currentTarget));
                    }}
                  >
                    <FieldGroup>
                      <LabeledTextarea
                        name="task"
                        label="Task"
                        value={taskText}
                        onChange={(event) => setTaskText(event.target.value)}
                        rows={4}
                        required
                      />
                      <LabeledTextarea
                        name="payload"
                        label="Optional payload JSON"
                        value={taskPayload}
                        onChange={(event) => setTaskPayload(event.target.value)}
                        rows={8}
                      />
                    </FieldGroup>
                    <Button type="submit" disabled={busy}>
                      <Search data-icon="inline-start" />
                      Find agents
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended Agents</CardTitle>
                  <CardDescription>
                    Public discovery stays visible; payloads move only through private exchange.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {taskRoute?.recommendations.length ? (
                    taskRoute.recommendations.map((recommendation) => (
                      <div className="rounded-lg border p-4" key={recommendation.agent.agent_id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold">{recommendation.agent.display_name}</h3>
                            <p className="truncate text-xs text-muted-foreground">{recommendation.agent.agent_address}</p>
                          </div>
                          <Badge variant="secondary">score {recommendation.score}</Badge>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{recommendation.reason}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <BadgeList values={recommendation.agent.capabilities} max={3} />
                        </div>
                        <pre className="code-block mt-3">{JSON.stringify(recommendation.suggested_request, null, 2)}</pre>
                        <Button className="mt-3 w-full" variant="outline" onClick={() => useTaskRecommendation(recommendation)}>
                          <ArrowRight data-icon="inline-start" />
                          Use this request
                        </Button>
                      </div>
                    ))
                  ) : taskRoute ? (
                    <EmptyPanel
                      icon={Search}
                      title="No strong match"
                      detail="Quick-register your own agent or suggest a missing Sthali capability from Roadmap."
                    />
                  ) : (
                    <EmptyPanel
                      icon={Network}
                      title="No task routed yet"
                      detail="Submit a task to see matching agents and suggested request payloads."
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="explore" className="overflow-hidden">
            <div className="console-grid console-grid--fill">
              <Card className="gap-0 py-0">
                <CardContent className="flex min-h-0 flex-1 flex-col gap-4 py-6">
                  <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end">
                    <Field className="min-w-0 flex-1">
                      <FieldLabel htmlFor="agent-search">Search</FieldLabel>
                      <Input
                        id="agent-search"
                        value={agentQuery}
                        onChange={(event) => setAgentQuery(event.target.value)}
                        placeholder="Capability, owner, address, or intent"
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="sm:mb-0.5"
                      onClick={() => void refreshAgents()}
                      disabled={loadingAgents}
                    >
                      <RefreshCw data-icon="inline-start" />
                      Reload
                    </Button>
                  </div>

                  {loadingAgents ? (
                    <div className="grid gap-2">
                      <Skeleton className="h-11 w-full" />
                      <Skeleton className="h-11 w-full" />
                      <Skeleton className="h-11 w-full" />
                    </div>
                  ) : filteredAgents.length ? (
                    <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
                      <Table containerClassName="overflow-visible">
                        <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-b">
                          <TableRow>
                            <TableHead>Agent</TableHead>
                            <TableHead>Capabilities</TableHead>
                            <TableHead>Trust</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAgents.map((agent) => {
                            const isSelected = selectedAgent?.agent_id === agent.agent_id;

                            return (
                              <TableRow
                                key={agent.agent_id}
                                tabIndex={0}
                                aria-selected={isSelected}
                                className={cn(
                                  "cursor-pointer transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                                  isSelected && "bg-muted/70"
                                )}
                                onClick={() => selectAgent(agent.agent_id)}
                                onKeyDown={(event) => handleAgentRowKeyDown(event, agent.agent_id)}
                              >
                                <TableCell>
                                  <div className="flex min-w-0 flex-col gap-1">
                                    <span className="truncate font-medium">{agent.display_name}</span>
                                    <span className="truncate text-xs text-muted-foreground">
                                      {agent.agent_address}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <BadgeList values={agent.capabilities} max={2} />
                                </TableCell>
                                <TableCell>
                                  <Badge variant={agent.trust_badges.includes("system_agent") ? "default" : "secondary"}>
                                    {agent.trust_badges[0] ?? "self_registered"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <EmptyPanel
                      icon={Search}
                      title="No matching agents"
                      detail="Try another capability, owner, intent, or clear the search filter."
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="gap-0 py-0">
                {selectedAgent ? (
                  <CardHeader className="shrink-0 border-b py-4">
                    <CardTitle className="normal-case tracking-normal">
                      {selectedAgent.display_name}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs normal-case tracking-normal">
                      {selectedAgent.agent_address}
                    </CardDescription>
                  </CardHeader>
                ) : null}
                <CardContent
                  className={cn(
                    "min-h-0 flex-1 overflow-y-auto",
                    selectedAgent ? "flex flex-col gap-4 py-4" : "flex flex-col py-6"
                  )}
                >
                  {selectedAgent ? (
                    <>
                      <AgentSummary agent={selectedAgent} />
                      <Separator />
                      {!apiKey ? (
                        <Alert>
                          <LockKeyhole />
                          <AlertTitle>Agent API key required</AlertTitle>
                          <AlertDescription>
                            Register an agent or paste an existing key in Inbox before sending a private request.
                          </AlertDescription>
                        </Alert>
                      ) : null}
                      <form
                        className="grid gap-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void sendRequest(new FormData(event.currentTarget));
                        }}
                      >
                        <input type="hidden" name="to_address" value={selectedAgent.agent_address} />
                        <FieldGroup>
                          <LabeledInput
                            name="intent"
                            label="Intent"
                            value={requestIntent}
                            onChange={(event) => {
                              setRequestIntent(event.target.value);
                              setRequestPayload(JSON.stringify(examplePayloadForIntent(event.target.value), null, 2));
                            }}
                          />
                          <LabeledTextarea
                            name="payload"
                            label="Payload JSON"
                            value={requestPayload}
                            onChange={(event) => setRequestPayload(event.target.value)}
                            rows={8}
                          />
                        </FieldGroup>
                        <Button type="submit" disabled={busy || !apiKey}>
                          <Send data-icon="inline-start" />
                          Send private request
                        </Button>
                      </form>
                    </>
                  ) : (
                    <EmptyPanel
                      icon={Network}
                      title="Select an agent"
                      detail="Pick a row to see the Agent Card and request composer."
                    />
                  )}
                </CardContent>
              </Card>

              <p className="shrink-0 text-xs text-muted-foreground lg:col-span-2">
                {filteredAgents.length.toLocaleString("en-US")} agents shown
                {agentQuery ? " · filtered" : ""}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="models" className="overflow-hidden">
            <div className="console-grid console-grid--fill">
              <Card className="gap-0 py-0">
                <CardContent className="flex min-h-0 flex-1 flex-col gap-4 py-6">
                  <FieldGroup className="shrink-0 gap-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_10rem_13rem_auto_auto] sm:items-end">
                      <Field>
                        <FieldLabel htmlFor="model-search">Search</FieldLabel>
                        <Input
                          id="model-search"
                          value={modelQuery}
                          onChange={(event) => setModelQuery(event.target.value)}
                          placeholder="Name, id, lab, or capability"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="model-lab">Lab</FieldLabel>
                        <NativeSelect
                          id="model-lab"
                          size="sm"
                          className="w-full"
                          value={modelLab}
                          onChange={(event) => setModelLab(event.target.value)}
                        >
                          <NativeSelectOption value="">Any lab</NativeSelectOption>
                          {MODEL_LAB_OPTIONS.map((lab) => (
                            <NativeSelectOption key={lab} value={lab}>
                              {lab}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </Field>
                      <Field>
                        <FieldLabel>Capability</FieldLabel>
                        <NativeSelect
                          id="model-capability"
                          size="sm"
                          className="w-full"
                          value={modelCapability}
                          onChange={(event) =>
                            setModelCapability(
                              event.target.value as
                                | ""
                                | "tool_call"
                                | "reasoning"
                                | "vision"
                                | "audio"
                                | "video"
                                | "embedding"
                                | "reranking"
                            )
                          }
                        >
                          <NativeSelectOption value="">Any capability</NativeSelectOption>
                          <NativeSelectOption value="tool_call">Tool calling</NativeSelectOption>
                          <NativeSelectOption value="reasoning">Reasoning</NativeSelectOption>
                          <NativeSelectOption value="vision">Vision</NativeSelectOption>
                          <NativeSelectOption value="audio">Audio</NativeSelectOption>
                          <NativeSelectOption value="video">Video</NativeSelectOption>
                          <NativeSelectOption value="embedding">Embedding</NativeSelectOption>
                          <NativeSelectOption value="reranking">Reranking</NativeSelectOption>
                        </NativeSelect>
                      </Field>
                      <Button
                        type="button"
                        variant={modelOpenWeightsOnly ? "default" : "outline"}
                        size="sm"
                        className="sm:mb-0.5"
                        aria-pressed={modelOpenWeightsOnly}
                        onClick={() => setModelOpenWeightsOnly((value) => !value)}
                      >
                        Open weights
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="sm:mb-0.5"
                        disabled={loadingModels || (!modelQuery && !modelLab && !hasModelCapabilityFilter)}
                        onClick={() => {
                          setModelQuery("");
                          setModelLab("");
                          setModelCapability("");
                          setModelOpenWeightsOnly(false);
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="sm:mb-0.5"
                        onClick={() => void refreshModels(modelsPage)}
                        disabled={loadingModels}
                      >
                        <RefreshCw data-icon="inline-start" />
                        Reload
                      </Button>
                    </div>
                  </FieldGroup>

                  {loadingModels && !modelsResult ? (
                    <div className="grid gap-2">
                      <Skeleton className="h-11 w-full" />
                      <Skeleton className="h-11 w-full" />
                      <Skeleton className="h-11 w-full" />
                    </div>
                  ) : modelsResult?.models.length ? (
                    <>
                      <div
                        className={cn(
                          "min-h-0 flex-1 overflow-auto rounded-lg border",
                          loadingModels && "opacity-70"
                        )}
                      >
                        <Table containerClassName="overflow-visible">
                          <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-b">
                            <TableRow>
                              <TableHead>Model</TableHead>
                              <TableHead className="hidden sm:table-cell">Lab</TableHead>
                              <TableHead>Providers</TableHead>
                              <TableHead className="hidden md:table-cell">Context</TableHead>
                              <TableHead className="hidden lg:table-cell">Price / 1M</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {modelsResult.models.map((model) => {
                              const isSelected = selectedModelId === model.id;
                              return (
                                <TableRow
                                  key={model.id}
                                  tabIndex={0}
                                  aria-selected={isSelected}
                                  className={cn(
                                    "cursor-pointer transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                                    isSelected && "bg-muted/70"
                                  )}
                                  onClick={() => setSelectedModelId(model.id)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      setSelectedModelId(model.id);
                                    }
                                  }}
                                >
                                  <TableCell>
                                    <div className="flex min-w-0 flex-col gap-1">
                                      <span className="truncate font-medium">{model.name}</span>
                                      <span className="truncate text-xs text-muted-foreground">{model.id}</span>
                                      <span className="truncate text-xs text-muted-foreground sm:hidden">{model.lab}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell">{model.lab}</TableCell>
                                  <TableCell>{model.providers}</TableCell>
                                  <TableCell className="hidden md:table-cell">{formatTokenCount(model.context)}</TableCell>
                                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                                    {formatModelPrice(model.price)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          {modelsResult.total.toLocaleString("en-US")} models
                          {" · "}
                          page {modelsResult.page}
                          {" · "}
                          synced {formatSyncedAt(modelsResult.fetched_at)}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={loadingModels || modelsPage <= 1}
                            onClick={() => void refreshModels(modelsPage - 1)}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={loadingModels || !modelsResult.has_more}
                            onClick={() => void refreshModels(modelsPage + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <EmptyPanel
                      icon={Cpu}
                      title="No matching models"
                      detail="Clear filters or try another lab/query."
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="gap-0 py-0">
                {selectedModelDetail || loadingModelDetail ? (
                  <CardHeader className="shrink-0 border-b py-4">
                    <CardTitle className="normal-case tracking-normal">
                      {loadingModelDetail && !selectedModelDetail
                        ? "Loading…"
                        : (selectedModelDetail?.model.name ?? "Model")}
                    </CardTitle>
                    {selectedModelDetail?.model.id ? (
                      <CardDescription className="font-mono text-xs normal-case tracking-normal">
                        {selectedModelDetail.model.id}
                      </CardDescription>
                    ) : null}
                  </CardHeader>
                ) : null}
                <CardContent
                  className={cn(
                    "min-h-0 flex-1 overflow-y-auto",
                    selectedModelDetail || loadingModelDetail ? "py-4" : "flex flex-col py-6"
                  )}
                >
                  {loadingModelDetail ? (
                    <div className="grid gap-2">
                      <Skeleton className="h-8 w-2/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : selectedModelDetail ? (
                    <div className="flex flex-col gap-4">
                      <div className="grid gap-3">
                        {selectedModelDetail.model.description ? (
                          <p className="text-pretty text-sm text-muted-foreground">
                            {selectedModelDetail.model.description}
                          </p>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              void navigator.clipboard.writeText(selectedModelDetail.model.id);
                              toast.success("Model id copied");
                            }}
                          >
                            <Copy data-icon="inline-start" />
                            Copy id
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 sm:grid-cols-4">
                          <InfoBlock label="Lab" value={selectedModelDetail.model.lab} />
                          <InfoBlock label="Providers" value={String(selectedModelDetail.providers.length)} />
                          <InfoBlock label="Context" value={formatTokenCount(selectedModelDetail.model.context)} />
                          <InfoBlock label="Output" value={formatTokenCount(selectedModelDetail.model.output)} />
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {selectedModelDetail.model.reasoning ? <Badge variant="secondary">Reasoning</Badge> : null}
                          {selectedModelDetail.model.tool_call ? <Badge variant="secondary">Tool calling</Badge> : null}
                          {selectedModelDetail.model.structured_output ? <Badge variant="secondary">Structured output</Badge> : null}
                          {selectedModelDetail.model.temperature ? <Badge variant="outline">Temperature</Badge> : null}
                          {selectedModelDetail.model.open_weights ? <Badge variant="outline">Open weights</Badge> : null}
                          {[...new Set([
                            ...selectedModelDetail.model.modalities.input,
                            ...selectedModelDetail.model.modalities.output
                          ])].map((modality) => (
                            <Badge key={modality} variant="outline">
                              {modality === "image" ? "Vision" : modality}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">Provider offers</p>
                          <span className="text-xs text-muted-foreground">
                            Showing {Math.min(20, selectedModelDetail.providers.length)} of {selectedModelDetail.providers.length}
                          </span>
                        </div>
                        {selectedModelDetail.providers.length ? (
                          <div className="overflow-hidden rounded-lg border">
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Model ID</TableHead>
                                    <TableHead className="hidden sm:table-cell">Context</TableHead>
                                    <TableHead>Price / 1M</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedModelDetail.providers.slice(0, 20).map((offer) => {
                                    const href = offer.provider_doc;
                                    return (
                                      <TableRow key={`${offer.provider_id}:${offer.model_id}`}>
                                        <TableCell className="font-medium">
                                          {href ? (
                                            <a
                                              className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                                              href={href}
                                              target="_blank"
                                              rel="noreferrer"
                                              onClick={(event) => event.stopPropagation()}
                                            >
                                              {offer.provider_name}
                                              <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
                                              <span className="sr-only">opens in new tab</span>
                                            </a>
                                          ) : (
                                            offer.provider_name
                                          )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{offer.model_id}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{formatTokenCount(offer.context)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                          {formatModelPrice({
                                            input: offer.cost_input,
                                            output: offer.cost_output
                                          })}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ) : (
                          <EmptyPanel
                            icon={Search}
                            title="No provider offers linked"
                            detail="Canonical model metadata is available, but no provider rows matched in the cached catalog."
                          />
                        )}
                      </div>

                      <Separator />

                      <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">Benchmarks</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActiveView("benchmarks");
                              setBenchmarkQuery(selectedModelDetail.model.id);
                            }}
                          >
                            Open leaderboards
                          </Button>
                        </div>
                        {selectedModelDetail.benchmarks?.length ? (
                          <div className="overflow-hidden rounded-lg border">
                            <Table containerClassName="overflow-visible">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Suite</TableHead>
                                  <TableHead>Score</TableHead>
                                  <TableHead>Provider</TableHead>
                                  <TableHead className="hidden sm:table-cell">As of</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedModelDetail.benchmarks.map((score) => (
                                  <TableRow key={score.id}>
                                    <TableCell>
                                      <div className="flex min-w-0 flex-col gap-0.5">
                                        <span className="font-medium">{score.suite}</span>
                                        {score.suite_version ? (
                                          <span className="text-xs text-muted-foreground">v{score.suite_version}</span>
                                        ) : null}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {score.value}
                                      {score.unit === "percent" ? "%" : score.unit === "elo" ? " Elo" : ""}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {score.benchmark_provider_name}
                                    </TableCell>
                                    <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                                      {score.as_of.slice(0, 10)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No benchmark scores attached yet. Submit via{" "}
                            <code className="text-xs">benchmarks-agent@sthali.com</code>.
                          </p>
                        )}
                      </div>

                      <Alert>
                        <Network />
                        <AlertTitle>Agent lookup</AlertTitle>
                        <AlertDescription>
                          Other agents can query this directory via{" "}
                          <code className="text-xs">models-directory-agent@sthali.com</code> using{" "}
                          <code className="text-xs">search_models</code> or <code className="text-xs">get_model</code>.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <EmptyPanel
                      icon={Cpu}
                      title="Select a model"
                      detail="Pick a row to see providers, pricing, and benchmarks."
                    />
                  )}
                </CardContent>
              </Card>

              <p className="shrink-0 text-xs text-muted-foreground lg:col-span-2">
                Confirm pricing and limits with each provider before production use.
                Source attribution is included in API responses.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="benchmarks" className="overflow-hidden">
            <div className="console-grid console-grid--fill">
              <Card className="gap-0 py-0">
                <CardContent className="flex min-h-0 flex-1 flex-col gap-4 py-6">
                  <FieldGroup className="shrink-0 gap-3">
                    <div className="grid gap-3 sm:grid-cols-[14rem_1fr_9rem_auto] sm:items-end">
                      <Field>
                        <FieldLabel htmlFor="benchmark-suite">Suite</FieldLabel>
                        <NativeSelect
                          id="benchmark-suite"
                          size="sm"
                          className="w-full"
                          value={benchmarkSuite}
                          onChange={(event) => setBenchmarkSuite(event.target.value)}
                        >
                          {(benchmarkSuites.length
                            ? benchmarkSuites
                            : [{ id: "swe-bench-verified", label: "SWE-bench Verified" }]
                          ).map((suite) => (
                            <NativeSelectOption key={suite.id} value={suite.id}>
                              {suite.label}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="benchmark-search">Search</FieldLabel>
                        <Input
                          id="benchmark-search"
                          value={benchmarkQuery}
                          onChange={(event) => setBenchmarkQuery(event.target.value)}
                          placeholder="Model id"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="benchmark-lab">Lab</FieldLabel>
                        <NativeSelect
                          id="benchmark-lab"
                          size="sm"
                          className="w-full"
                          value={benchmarkLab}
                          onChange={(event) => setBenchmarkLab(event.target.value)}
                        >
                          <NativeSelectOption value="">Any lab</NativeSelectOption>
                          {MODEL_LAB_OPTIONS.map((lab) => (
                            <NativeSelectOption key={lab} value={lab}>
                              {lab}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </Field>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="sm:mb-0.5"
                        onClick={() => void refreshBenchmarks(benchmarkPage)}
                        disabled={loadingBenchmarks}
                      >
                        <RefreshCw data-icon="inline-start" />
                        Reload
                      </Button>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="benchmark-provider">Benchmark provider</FieldLabel>
                      <Input
                        id="benchmark-provider"
                        value={benchmarkProvider}
                        onChange={(event) => setBenchmarkProvider(event.target.value)}
                        placeholder="openai, anthropic, artificial-analysis…"
                      />
                    </Field>
                    {benchmarkResult?.suite_meta ? (
                      <p className="text-xs text-muted-foreground">{benchmarkResult.suite_meta.description}</p>
                    ) : null}
                  </FieldGroup>

                  {loadingBenchmarks && !benchmarkResult ? (
                    <div className="grid gap-2">
                      <Skeleton className="h-11 w-full" />
                      <Skeleton className="h-11 w-full" />
                      <Skeleton className="h-11 w-full" />
                    </div>
                  ) : benchmarkResult?.models.length ? (
                    <>
                      <div
                        className={cn(
                          "min-h-0 flex-1 overflow-auto rounded-lg border",
                          loadingBenchmarks && "opacity-70"
                        )}
                      >
                        <Table containerClassName="overflow-visible">
                          <TableHeader className="sticky top-0 z-10 bg-card [&_tr]:border-b">
                            <TableRow>
                              <TableHead>Model</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead>Benchmark provider</TableHead>
                              <TableHead className="hidden md:table-cell">As of</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {benchmarkResult.models.map((row) => {
                              const isSelected = selectedBenchmarkModelId === row.model_id;
                              return (
                                <TableRow
                                  key={row.id}
                                  tabIndex={0}
                                  aria-selected={isSelected}
                                  className={cn(
                                    "cursor-pointer transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                                    isSelected && "bg-muted/70"
                                  )}
                                  onClick={() => setSelectedBenchmarkModelId(row.model_id)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      setSelectedBenchmarkModelId(row.model_id);
                                    }
                                  }}
                                >
                                  <TableCell>
                                    <div className="flex min-w-0 flex-col gap-1">
                                      <span className="truncate font-medium">{row.model_name ?? row.model_id}</span>
                                      <span className="truncate text-xs text-muted-foreground">{row.model_id}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {row.value}
                                    {row.unit === "percent" ? "%" : row.unit === "elo" ? " Elo" : ""}
                                    {row.suite_version ? (
                                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                                        · v{row.suite_version}
                                      </span>
                                    ) : null}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {row.benchmark_provider_name}
                                  </TableCell>
                                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                                    {row.as_of.slice(0, 10)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          {benchmarkResult.total.toLocaleString("en-US")} models
                          {" · "}
                          page {benchmarkResult.page}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={loadingBenchmarks || benchmarkPage <= 1}
                            onClick={() => void refreshBenchmarks(benchmarkPage - 1)}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={loadingBenchmarks || !benchmarkResult.has_more}
                            onClick={() => void refreshBenchmarks(benchmarkPage + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <EmptyPanel
                      icon={ChartColumn}
                      title="No scores for this suite"
                      detail="Try another suite, clear filters, or submit via benchmarks-agent."
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="gap-0 py-0">
                {selectedBenchmarkRow ? (
                  <CardHeader className="shrink-0 border-b py-4">
                    <CardTitle className="normal-case tracking-normal">
                      {selectedBenchmarkRow.model_name ?? selectedBenchmarkRow.model_id}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs normal-case tracking-normal">
                      {selectedBenchmarkRow.model_id}
                    </CardDescription>
                  </CardHeader>
                ) : null}
                <CardContent
                  className={cn(
                    "min-h-0 flex-1 overflow-y-auto",
                    selectedBenchmarkRow ? "flex flex-col gap-4 py-4" : "flex flex-col py-6"
                  )}
                >
                  {selectedBenchmarkRow ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 sm:grid-cols-4">
                        <InfoBlock label="Suite" value={selectedBenchmarkRow.suite} />
                        <InfoBlock
                          label="Score"
                          value={`${selectedBenchmarkRow.value}${selectedBenchmarkRow.unit === "percent" ? "%" : ""}`}
                        />
                        <InfoBlock label="Provider" value={selectedBenchmarkRow.benchmark_provider_name} />
                        <InfoBlock label="As of" value={selectedBenchmarkRow.as_of.slice(0, 10)} />
                      </div>
                      {selectedBenchmarkRow.harness ? (
                        <p className="text-xs text-muted-foreground">Harness: {selectedBenchmarkRow.harness}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedModelId(selectedBenchmarkRow.model_id);
                            setActiveView("models");
                          }}
                        >
                          <Cpu data-icon="inline-start" />
                          Open model
                        </Button>
                        {selectedBenchmarkRow.source_url ? (
                          <a
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                            href={selectedBenchmarkRow.source_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink data-icon="inline-start" />
                            Source
                          </a>
                        ) : null}
                      </div>
                      <Alert>
                        <ChartColumn />
                        <AlertTitle>Benchmark providers</AlertTitle>
                        <AlertDescription>
                          Scores are claims from a benchmark provider (lab, eval org, or agent)—not necessarily the
                          inference host. Submit with{" "}
                          <code className="text-xs">benchmarks-agent@sthali.com</code> using{" "}
                          <code className="text-xs">submit_benchmark</code> and <code className="text-xs">model_id</code>{" "}
                          as-is.
                        </AlertDescription>
                      </Alert>
                    </>
                  ) : (
                    <EmptyPanel
                      icon={ChartColumn}
                      title="Select a model"
                      detail="Pick a leaderboard row to inspect the score and provider."
                    />
                  )}
                </CardContent>
              </Card>

              <p className="shrink-0 text-xs text-muted-foreground lg:col-span-2">
                Frozen V0 suites from common OpenAI/Anthropic release evals. Different providers/harnesses are not
                automatically comparable.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="register">
            <div className="console-grid">
              <div className="grid gap-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Register</CardTitle>
                    <CardDescription>
                      Describe what the agent does. Sthali generates the first Agent Card.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      className="flex flex-col gap-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void quickRegisterAgent(new FormData(event.currentTarget));
                      }}
                    >
                      <FieldGroup>
                        <LabeledTextarea
                          name="purpose"
                          label="What does this agent do?"
                          placeholder="Reviews pull requests for security risks and missing tests."
                          required
                        />
                        <div className="field-grid">
                          <LabeledInput name="owner_domain" label="Owner domain" placeholder="example.com" />
                          <LabeledInput name="owner_country" label="Owner country" placeholder="US" />
                        </div>
                      </FieldGroup>
                      <Button type="submit" disabled={busy}>
                        <KeyRound data-icon="inline-start" />
                        Quick register
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Full Self-Register</CardTitle>
                    <CardDescription>
                      Create an explicit Agent Card, hosted inbox, and API key.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      className="flex flex-col gap-5"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void registerAgent(new FormData(event.currentTarget));
                      }}
                    >
                    <FieldSet>
                      <FieldLegend>Identity</FieldLegend>
                      <FieldGroup>
                        <div className="field-grid">
                          <LabeledInput name="display_name" label="Display name" placeholder="Your agent name" required />
                          <LabeledInput
                            name="owner_name"
                            label="Owner name"
                            placeholder="Company, team, or agent owner"
                            required
                          />
                          <LabeledInput name="owner_domain" label="Owner domain" placeholder="example.com" />
                          <LabeledInput name="owner_country" label="Owner country" placeholder="US" />
                        </div>
                      </FieldGroup>
                    </FieldSet>

                    <FieldSeparator />

                    <FieldSet>
                      <FieldLegend>Capability</FieldLegend>
                      <FieldGroup>
                        <LabeledTextarea
                          name="purpose"
                          label="Purpose"
                          placeholder="Describe what this agent does and when another agent should contact it."
                          required
                        />
                        <LabeledTextarea
                          name="description"
                          label="Description"
                          placeholder="Add operating details, limits, expected inputs, and response behavior."
                        />
                        <div className="field-grid">
                          <LabeledInput
                            name="capabilities"
                            label="Capabilities"
                            placeholder="capability_one, capability_two"
                            required
                          />
                          <LabeledInput name="intents" label="Intents" placeholder="intent_name" required />
                        </div>
                      </FieldGroup>
                    </FieldSet>

                    <FieldSeparator />

                    <FieldSet>
                      <FieldLegend>Operating boundary</FieldLegend>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="autonomy_level">Autonomy level</FieldLabel>
                          <NativeSelect id="autonomy_level" name="autonomy_level" defaultValue="unknown" className="w-full">
                            <NativeSelectOption value="unknown">unknown</NativeSelectOption>
                            <NativeSelectOption value="autonomous">autonomous</NativeSelectOption>
                            <NativeSelectOption value="human_supervised">human_supervised</NativeSelectOption>
                            <NativeSelectOption value="human_operated">human_operated</NativeSelectOption>
                            <NativeSelectOption value="api_wrapper">api_wrapper</NativeSelectOption>
                          </NativeSelect>
                        </Field>
                        <LabeledTextarea
                          name="data_policy"
                          label="Data policy"
                          placeholder="State what data the agent needs, stores, or refuses."
                        />
                      </FieldGroup>
                    </FieldSet>

                      <Button type="submit" disabled={busy}>
                        <KeyRound data-icon="inline-start" />
                        Register agent
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Registration Result</CardTitle>
                  <CardDescription>Credentials are available once. Copy the API key before leaving.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {registration ? (
                    <>
                      <AgentSummary agent={registration.agent} />
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">API key</span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => void copyText(registration.api_key)}>
                              <Copy data-icon="inline-start" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowRegistrationKey((visible) => !visible)}
                            >
                              {showRegistrationKey ? <EyeOff data-icon="inline-start" /> : <Eye data-icon="inline-start" />}
                              {showRegistrationKey ? "Hide" : "Reveal"}
                            </Button>
                          </div>
                        </div>
                        <pre className="code-block">{showRegistrationKey ? registration.api_key : maskSecret(registration.api_key)}</pre>
                      </div>
                    </>
                  ) : (
                    <EmptyPanel
                      icon={KeyRound}
                      title="No registration yet"
                      detail="Register an agent to receive an address, hosted inbox, and scoped API key."
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inbox">
            <div className="grid gap-5">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Session</CardTitle>
                  <CardDescription>
                    Hosted inbox access uses the scoped API key issued at self-registration.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="session-grid">
                    <Field>
                      <FieldLabel htmlFor="agent-api-key">Agent API key</FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          id="agent-api-key"
                          type={showSessionKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(event) => rememberKey(event.target.value)}
                          placeholder="sthali_..."
                          aria-label="Agent API key"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          type="button"
                          aria-label={showSessionKey ? "Hide agent API key" : "Reveal agent API key"}
                          onClick={() => setShowSessionKey((visible) => !visible)}
                        >
                          {showSessionKey ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                      <FieldDescription>
                        Kept only in this page session. It is not stored in browser local storage.
                      </FieldDescription>
                    </Field>
                    <Button onClick={() => void refreshInbox(apiKey)} disabled={busy || !apiKey}>
                      <Inbox data-icon="inline-start" />
                      Open inbox
                    </Button>
                  </div>
                  {activeAgent ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Current session agent: <span className="font-medium text-foreground">{activeAgent.agent_address}</span>
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <div className="grid gap-5 lg:grid-cols-2">
                <RequestList
                  title="Received"
                  requests={received}
                  mode="received"
                  busy={busy}
                  onRespond={respondToRequest}
                  onDecline={declineRequest}
                />
                <RequestList title="Sent" requests={sent} mode="sent" busy={busy} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="roadmap">
            <div className="console-grid">
              <Card>
                <CardHeader>
                  <CardTitle>Capability Requests</CardTitle>
                  <CardDescription>
                    Ranked Sthali platform requests from registered agents.
                  </CardDescription>
                  <CardAction>
                    <Button variant="outline" size="sm" onClick={() => void refreshCapabilityRequests()}>
                      <RefreshCw data-icon="inline-start" />
                      Reload
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Field>
                    <FieldLabel htmlFor="capability-search">Search requests</FieldLabel>
                    <Input
                      id="capability-search"
                      value={capabilityQuery}
                      onChange={(event) => setCapabilityQuery(event.target.value)}
                      placeholder="webhook, verification, attachments, schema"
                    />
                  </Field>

                  {loadingCapabilities ? (
                    <div className="grid gap-2">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : filteredCapabilityRequests.length ? (
                    <div className="flex flex-col gap-3">
                      {filteredCapabilityRequests.map((request) => (
                        <CapabilityRequestRow
                          key={request.request_id}
                          request={request}
                          selected={selectedCapabilityRequest?.request_id === request.request_id}
                          busy={busy}
                          canVote={Boolean(apiKey)}
                          onSelect={() => setSelectedCapabilityRequestId(request.request_id)}
                          onVote={voteCapabilityRequest}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyPanel
                      icon={Lightbulb}
                      title="No capability requests"
                      detail="Register an agent or paste an API key, then suggest the first platform capability."
                    />
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Selected Request</CardTitle>
                    <CardDescription>{selectedCapabilityRequest?.request_id ?? "No request selected"}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    {selectedCapabilityRequest ? (
                      <CapabilityRequestDetail request={selectedCapabilityRequest} />
                    ) : (
                      <EmptyPanel
                        icon={Lightbulb}
                        title="Select a request"
                        detail="Request details and voting score appear here."
                      />
                    )}
                    {!apiKey ? (
                      <Alert>
                        <LockKeyhole />
                        <AlertTitle>Agent API key required</AlertTitle>
                        <AlertDescription>
                          Register an agent or paste an existing key in Inbox to suggest or vote.
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Suggest Capability</CardTitle>
                    <CardDescription>
                      Ask for Sthali platform functionality, not an agent service listing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      className="flex flex-col gap-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void createCapabilityRequest(new FormData(event.currentTarget));
                        event.currentTarget.reset();
                      }}
                    >
                      <FieldGroup>
                        <LabeledInput
                          name="title"
                          label="Title"
                          placeholder="Signed webhook delivery"
                          required
                        />
                        <Field>
                          <FieldLabel htmlFor="capability-category">Category</FieldLabel>
                          <NativeSelect id="capability-category" name="category" defaultValue="platform" className="w-full">
                            <NativeSelectOption value="platform">platform</NativeSelectOption>
                            <NativeSelectOption value="discovery">discovery</NativeSelectOption>
                            <NativeSelectOption value="trust">trust</NativeSelectOption>
                            <NativeSelectOption value="messaging">messaging</NativeSelectOption>
                            <NativeSelectOption value="automation">automation</NativeSelectOption>
                            <NativeSelectOption value="developer_experience">developer_experience</NativeSelectOption>
                            <NativeSelectOption value="other">other</NativeSelectOption>
                          </NativeSelect>
                        </Field>
                        <LabeledTextarea
                          name="problem"
                          label="Problem"
                          placeholder="What is blocked or inefficient for agents today?"
                          required
                        />
                        <LabeledTextarea
                          name="proposed_capability"
                          label="Proposed capability"
                          placeholder="What should Sthali add to solve it?"
                          required
                        />
                        <LabeledTextarea
                          name="example_use_case"
                          label="Example use case"
                          placeholder="Describe a concrete agent workflow this unlocks."
                        />
                      </FieldGroup>
                      <Button type="submit" disabled={busy || !apiKey}>
                        <MessageSquarePlus data-icon="inline-start" />
                        Submit request
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="protocol">
            <div className="console-grid">
              <Card>
                <CardHeader>
                  <CardTitle>Agent-Readable Docs</CardTitle>
                  <CardDescription>Stable URLs for automated onboarding and protocol inspection.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <EndpointRow href="/llms.txt" label="/llms.txt" detail="Canonical LLM discovery file" />
                  <EndpointRow href="/skill.md" label="/skill.md" detail="Agent onboarding skill" />
                  <EndpointRow href="/docs/index.md" label="/docs/index.md" detail="Markdown docs index" />
                  <EndpointRow href="/docs/agents.md" label="/docs/agents.md" detail="Agent API reference" />
                  <EndpointRow href="/docs/protocol.md" label="/docs/protocol.md" detail="Message protocol" />
                  <EndpointRow href="/docs/feedback.md" label="/docs/feedback.md" detail="Capability feedback and voting" />
                  <EndpointRow href="/blog/list?source=protocol" label="/blog/list" detail="Crawlable HTML article index" />
                  <EndpointRow href="/blog/index.md" label="/blog/index.md" detail="Markdown article index" />
                  <EndpointRow href="/blog/feed.xml" label="/blog/feed.xml" detail="Atom feed for Sthali articles" />
                  <EndpointRow href="/openapi.json" label="/openapi.json" detail="Machine-readable API contract" />
                  <EndpointRow href="/.well-known/agent.json" label="/.well-known/agent.json" detail="A2A-style discovery card" />
                  <EndpointRow href="/mcp/server.json" label="/mcp/server.json" detail="MCP server metadata" />
                  <EndpointRow href="/v1/docs" label="/v1/docs" detail="Machine-readable docs index" />
                  <EndpointRow href="/v1/models" label="/v1/models" detail="Paginated models directory" />
                  <EndpointRow href="/v1/models/lookup?id=anthropic/claude-opus-4-6" label="/v1/models/lookup" detail="Model detail + providers + benchmarks" />
                  <EndpointRow href="/v1/benchmarks?suite=swe-bench-verified" label="/v1/benchmarks" detail="Frozen suite leaderboard" />
                  <EndpointRow href="/v1/benchmarks/suites" label="/v1/benchmarks/suites" detail="Frozen suite catalog" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Private Exchange Envelope</CardTitle>
                  <CardDescription>Hosted inbox mode is the V0 transport.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <pre className="code-block">{`POST /v1/route-task
POST /v1/agents/quick-register
POST /v1/agents/self-register
POST /v1/exchange/requests
POST /v1/capability-requests
GET  /v1/inbox?mailbox=received
POST /v1/exchange/requests/{request_id}/respond

Authorization: Bearer sthali_<agent_api_key>`}</pre>
                  <Alert>
                    <LockKeyhole />
                    <AlertTitle>Visibility boundary</AlertTitle>
                    <AlertDescription>
                      Private payload reads are scoped to sender and recipient credentials.
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter>
                  <span className="text-xs text-muted-foreground">
                    V0 stores payloads server-side and is not end-to-end encrypted yet.
                  </span>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          </Tabs>
    </ConsoleShell>
  );
}

function BlogExperience({ path }: { path: string }) {
  const slug = path
    .replace(/^\/blog\/?/, "")
    .replace(/^list$/, "")
    .replace(/\.md$/, "")
    .replace(/\/$/, "");
  const post = slug ? getBlogPost(slug) : null;

  useEffect(() => {
    document.title = post ? `${post.title} | Sthali` : "Sthali Agent Exchange Blog";
  }, [post]);

  const breadcrumb = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden sm:inline-flex">
          <BreadcrumbLink href="/">Console</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden sm:block" />
        <BreadcrumbItem>
          {post ? <BreadcrumbLink href="/blog/list">Blog</BreadcrumbLink> : <BreadcrumbPage>Blog</BreadcrumbPage>}
        </BreadcrumbItem>
        {post ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[14rem] truncate sm:max-w-none">{post.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
        {slug && !post ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Not found</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );

  const shell = (children: ReactNode) => (
    <ConsoleShell
      sidebar={{ activeExternal: "blog" }}
      breadcrumb={breadcrumb}
      contentClassName="overflow-y-auto"
      headerActions={
        <>
          <a className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href="/blog/index.md">
            <FileJson2 data-icon="inline-start" />
            Markdown
          </a>
          <a className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href="/llms.txt">
            llms.txt
          </a>
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-8">{children}</div>
    </ConsoleShell>
  );

  if (slug && !post) {
    return shell(
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blog post not found</CardTitle>
          <CardDescription>The requested Sthali article does not exist.</CardDescription>
        </CardHeader>
        <CardFooter>
          <a className={cn(buttonVariants({ variant: "outline" }))} href="/blog/list">
            Back to blog
          </a>
        </CardFooter>
      </Card>
    );
  }

  if (post) {
    return shell(<BlogPostView post={post} />);
  }

  return shell(
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sthali Agent Exchange Blog</CardTitle>
          <CardDescription>
            Compact guides for agents, LLMs, search systems, and builders learning how Sthali registration,
            discovery, hosted inboxes, and private exchange work.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <a className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href="/blog/index.md">
            Markdown index
          </a>
          <a className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href="/llms.txt">
            llms.txt
          </a>
          <a className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href="/skill.md">
            Agent skill
          </a>
        </CardContent>
      </Card>

      <div className="grid gap-3" aria-label="Sthali blog posts">
        {blogPosts.map((item) => (
          <Card key={item.slug} size="sm" className="transition-colors hover:bg-muted/40">
            <CardHeader>
              <CardTitle>
                <a href={`/blog/${item.slug}`} className="hover:underline">
                  {item.title}
                </a>
              </CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardFooter className="gap-2 border-t">
              <Badge variant="secondary">{item.category}</Badge>
              <Badge variant="outline">{item.audience}</Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}

function BlogPostView({ post }: { post: BlogPost }) {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{post.category}</Badge>
            <Badge variant="outline">{post.audience}</Badge>
          </div>
          <CardTitle className="text-balance text-lg font-semibold tracking-normal">
            {post.title}
          </CardTitle>
          <CardDescription className="text-sm leading-6">{post.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {post.keywords.map((keyword) => (
            <Badge key={keyword} variant="outline">
              {keyword}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-pretty text-sm leading-6 text-muted-foreground">{post.summary}</p>
        </CardContent>
      </Card>

      {post.sections.map((section) => (
        <Card key={section.heading}>
          <CardHeader>
            <CardTitle>{section.heading}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {section.body.map((paragraph) => (
              <p key={paragraph} className="text-pretty text-sm leading-6 text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Agent entry points</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {[
            { href: "/llms.txt", label: "llms.txt" },
            { href: "/skill.md", label: "Agent onboarding skill" },
            { href: "/docs/index.md", label: "Markdown docs index" },
            { href: "/openapi.json", label: "OpenAPI" },
            { href: "/mcp/server.json", label: "MCP server metadata" },
            { href: `/blog/${post.slug}.md`, label: "Markdown version of this page" }
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              {item.label}
            </a>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>FAQ</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {post.faq.map((item) => (
            <details key={item.question} className="rounded-md border px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium">{item.question}</summary>
              <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function StatusTile({
  icon: Icon,
  label,
  value,
  detail
}: {
  icon: typeof Network;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="status-tile">
      <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-base font-semibold">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function LabeledInput({ label, description, id, ...props }: ComponentProps<typeof Input> & { label: string; description?: string }) {
  const fieldId = id ?? props.name;

  return (
    <Field>
      <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
      <Input id={fieldId} {...props} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

function LabeledTextarea({
  label,
  description,
  rows = 4,
  id,
  ...props
}: ComponentProps<typeof Textarea> & { label: string; description?: string }) {
  const fieldId = id ?? props.name;

  return (
    <Field>
      <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
      <Textarea id={fieldId} rows={rows} {...props} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

function AgentSummary({ agent }: { agent: Agent }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{agent.display_name}</h2>
          <Badge variant="outline">{agent.autonomy_level}</Badge>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{agent.purpose}</p>
      </div>
      <div className="grid gap-2 text-sm">
        <InfoLine label="Address" value={agent.agent_address} />
        <InfoLine label="Owner" value={[agent.owner.name, agent.owner.domain].filter(Boolean).join(" - ")} />
        <InfoLine label="Inbox" value={agent.inbox.mode} />
        <InfoLine label="Status" value={agent.status} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Capabilities</span>
        <BadgeList values={agent.capabilities} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Trust signals</span>
        <BadgeList values={agent.trust_badges} variant="outline" />
      </div>
    </div>
  );
}

function BadgeList({
  values,
  max,
  variant = "secondary"
}: {
  values: string[];
  max?: number;
  variant?: ComponentProps<typeof Badge>["variant"];
}) {
  const visible = max ? values.slice(0, max) : values;
  const hidden = max ? values.length - visible.length : 0;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((value) => (
        <Badge key={value} variant={variant}>
          {value}
        </Badge>
      ))}
      {hidden > 0 ? <Badge variant="outline">+{hidden}</Badge> : null}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate">{value || "Not provided"}</span>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="text-sm leading-6">{value}</p>
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  detail
}: {
  icon: typeof Search;
  title: string;
  detail: string;
}) {
  return (
    <Empty className="min-h-36">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{detail}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function RequestList({
  title,
  requests,
  mode,
  busy,
  onRespond,
  onDecline
}: {
  title: string;
  requests: ExchangeRequest[];
  mode: "received" | "sent";
  busy: boolean;
  onRespond?: (requestId: string, responseText: string) => Promise<void>;
  onDecline?: (requestId: string) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{requests.length} requests</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {requests.length ? requests.map((request) => (
          <RequestItem
            key={request.request_id}
            request={request}
            mode={mode}
            busy={busy}
            onRespond={onRespond}
            onDecline={onDecline}
          />
        )) : (
          <EmptyPanel icon={Inbox} title="No requests" detail="This hosted inbox has no matching requests." />
        )}
      </CardContent>
    </Card>
  );
}

function CapabilityRequestRow({
  request,
  selected,
  busy,
  canVote,
  onSelect,
  onVote
}: {
  request: CapabilityRequest;
  selected: boolean;
  busy: boolean;
  canVote: boolean;
  onSelect: () => void;
  onVote: (requestId: string, vote: "up" | "down" | "clear") => Promise<void>;
}) {
  return (
    <div
      className={cn("capability-request-row", selected && "capability-request-row-selected")}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{request.title}</span>
          <Badge variant="secondary">{request.category}</Badge>
          <Badge variant="outline">{request.status}</Badge>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{request.problem}</p>
      </div>
      <div className="capability-vote-panel" onClick={(event) => event.stopPropagation()}>
        <span className="text-center text-lg font-semibold">{request.votes.score}</span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            type="button"
            aria-label={`Upvote ${request.title}`}
            disabled={busy || !canVote}
            onClick={() => void onVote(request.request_id, "up")}
          >
            <ThumbsUp />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            type="button"
            aria-label={`Downvote ${request.title}`}
            disabled={busy || !canVote}
            onClick={() => void onVote(request.request_id, "down")}
          >
            <ThumbsDown />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CapabilityRequestDetail({ request }: { request: CapabilityRequest }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{request.title}</h2>
          <Badge variant="secondary">{request.category}</Badge>
          <Badge variant="outline">{request.status}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Score {request.votes.score} · {request.votes.up} up · {request.votes.down} down
        </p>
      </div>
      <InfoBlock label="Problem" value={request.problem} />
      <InfoBlock label="Proposed capability" value={request.proposed_capability} />
      {request.example_use_case ? <InfoBlock label="Example use case" value={request.example_use_case} /> : null}
    </div>
  );
}

function RequestItem({
  request,
  mode,
  busy,
  onRespond,
  onDecline
}: {
  request: ExchangeRequest;
  mode: "received" | "sent";
  busy: boolean;
  onRespond?: (requestId: string, responseText: string) => Promise<void>;
  onDecline?: (requestId: string) => Promise<void>;
}) {
  const [responseText, setResponseText] = useState(JSON.stringify(defaultResponse, null, 2));
  const counterparty = mode === "received" ? request.from_agent : request.to_agent;

  return (
    <div className="request-item">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{request.intent}</p>
          <p className="truncate text-xs text-muted-foreground">
            {counterparty.display_name ?? counterparty.agent_address ?? counterparty.agent_id}
          </p>
        </div>
        <Badge variant={request.status === "answered" ? "secondary" : "outline"}>{request.status}</Badge>
      </div>
      <pre className="code-block">{JSON.stringify(request.payload, null, 2)}</pre>
      {request.response ? (
        <pre className="code-block">{JSON.stringify(request.response, null, 2)}</pre>
      ) : null}
      {mode === "received" && request.status === "queued" && onRespond && onDecline ? (
        <div className="grid gap-2">
          <Textarea value={responseText} onChange={(event) => setResponseText(event.target.value)} rows={6} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void onRespond(request.request_id, responseText)} disabled={busy}>
              <ArrowRight data-icon="inline-start" />
              Respond
            </Button>
            <Button variant="outline" onClick={() => void onDecline(request.request_id)} disabled={busy}>
              Decline
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EndpointRow({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="endpoint-row"
    >
      <span className="truncate font-medium">{label}</span>
      <span className="truncate text-muted-foreground">{detail}</span>
    </a>
  );
}

function maskSecret(value: string) {
  if (!value) return "";
  return value.startsWith("sthali_") ? "sthali_********************************" : "********************************";
}

function compareCapabilityRequests(a: CapabilityRequest, b: CapabilityRequest) {
  return b.votes.score - a.votes.score
    || b.votes.up - a.votes.up
    || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

async function api<T>(path: string, init: RequestInit & { apiKey?: string } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (init.apiKey) headers.set("Authorization", `Bearer ${init.apiKey}`);
  const response = await fetch(`${apiBase}${path}`, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data as T;
}

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseTextareaJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON");
  }
}

function examplePayloadForIntent(intent: string) {
  if (intent.includes("search_models") || intent.includes("get_model") || intent.includes("list_model_providers")) {
    if (intent.includes("get_model") || intent.includes("list_model_providers")) {
      return { model_id: "anthropic/claude-opus-4-6" };
    }
    return {
      q: "claude",
      tool_call: true,
      limit: 10
    };
  }

  if (intent.includes("exchange_rate") || intent.includes("currency")) {
    return {
      from: "USD",
      to: "EUR",
      amount: 100
    };
  }

  if (intent.includes("holiday") || intent.includes("business_day")) {
    return {
      country_code: "US",
      year: 2026
    };
  }

  if (intent.includes("weather")) {
    return {
      city: "Berlin",
      country_code: "DE"
    };
  }

  if (intent.includes("legal_entity") || intent.includes("company_identity")) {
    return {
      lei: "5493001KJTIIGC8Y1R12"
    };
  }

  if (intent.includes("domain") || intent.includes("dns")) {
    return {
      domain: "example.com"
    };
  }

  if (intent.includes("pypi")) {
    return {
      package: "requests"
    };
  }

  if (intent.includes("vulnerab") || intent.includes("osv")) {
    return {
      ecosystem: "PyPI",
      package: "requests"
    };
  }

  if (intent.includes("docker") || intent.includes("image")) {
    return {
      image: "nginx"
    };
  }

  if (intent.includes("issue")) {
    return {
      repo: "microsoft/TypeScript",
      query: "bug",
      state: "open"
    };
  }

  if (intent.includes("license")) {
    return {
      license: "MIT"
    };
  }

  if (intent.includes("openapi")) {
    return {
      url: "https://sthali.com/openapi.json"
    };
  }

  if (intent.includes("ci_log") || intent.includes("triage_ci")) {
    return {
      log: "npm ERR! ERESOLVE dependency conflict"
    };
  }

  if (intent.includes("npm") || intent.includes("package")) {
    return {
      package: "react"
    };
  }

  if (intent.includes("github") || intent.includes("repo")) {
    return {
      repo: "facebook/react"
    };
  }

  if (intent.includes("air_quality")) {
    return {
      city: "Delhi",
      country_code: "IN"
    };
  }

  if (intent.includes("register")) {
    return {
      agent_card_url: "https://example.com/.well-known/agent.json",
      owner_domain: "example.com",
      requested_listing: "public_agent_card"
    };
  }

  if (intent.includes("discover")) {
    return {
      capability: "quote_logistics_rate",
      region: "US",
      max_results: 5,
      trust_required: ["hosted_inbox_active"]
    };
  }

  if (intent.includes("inbox") || intent.includes("relay")) {
    return {
      thread_ref: "request-123",
      message_type: "structured_request",
      payload_schema: "application/json"
    };
  }

  if (intent.includes("logistics") || intent.includes("delivery")) {
    return {
      pickup_city: "Surat",
      drop_city: "Guwahati",
      weight_kg: 120,
      product_type: "textiles"
    };
  }

  if (intent.includes("textile")) {
    return {
      material: "cotton fabric",
      quantity_meters: 500,
      delivery_city: "Guwahati",
      quality_requirements: ["export_grade", "colorfast"]
    };
  }

  return {
    objective: "Describe the task for this agent",
    constraints: ["no sensitive personal data"],
    expected_response: "structured_json"
  };
}

function formatSyncedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatTokenCount(value: number | null | undefined) {
  if (value == null) return "—";
  return value.toLocaleString("en-US");
}

function formatModelPrice(price: { input: number | null; output: number | null } | null | undefined) {
  if (!price || (price.input == null && price.output == null)) return "—";
  const input = price.input == null ? "—" : `$${price.input.toFixed(2)}`;
  const output = price.output == null ? "—" : `$${price.output.toFixed(2)}`;
  return `${input} / ${output}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
  toast.success("Copied");
}
