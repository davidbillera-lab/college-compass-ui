import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle,
  Shield,
  CreditCard,
  Server,
  RefreshCw,
  Bell,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

type MonitoringAlert = {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  details: string | null;
  metadata: Record<string, any>;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
};

const severityConfig = {
  critical: { color: "bg-destructive text-destructive-foreground", icon: AlertTriangle },
  warning: { color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30", icon: AlertTriangle },
  info: { color: "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30", icon: Bell },
};

const typeConfig: Record<string, { label: string; icon: any }> = {
  auth_error: { label: "Auth", icon: Shield },
  payment_failure: { label: "Payment", icon: CreditCard },
  edge_function_error: { label: "Function", icon: Server },
  system: { label: "System", icon: Activity },
};

export default function AdminMonitoringPage() {
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ["monitoring-alerts", filter],
    queryFn: async () => {
      let query = supabase
        .from("monitoring_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        query = query.eq("alert_type", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MonitoringAlert[];
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("monitoring_alerts")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring-alerts"] });
      toast.success("Alert resolved");
    },
  });

  const runCheckMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("monitor-alerts", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      return res.data;
    },
    onSuccess: (data) => {
      refetch();
      toast.success(`Monitor check complete: ${data?.alerts_created || 0} alerts found`);
    },
    onError: (err) => toast.error(`Check failed: ${err.message}`),
  });

  const unresolvedCount = alerts.filter((a) => !a.resolved).length;
  const criticalCount = alerts.filter((a) => a.severity === "critical" && !a.resolved).length;
  const warningCount = alerts.filter((a) => a.severity === "warning" && !a.resolved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time alerts for auth, payments, and system health</p>
        </div>
        <Button
          onClick={() => runCheckMutation.mutate()}
          disabled={runCheckMutation.isPending}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${runCheckMutation.isPending ? "animate-spin" : ""}`} />
          Run Check Now
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalCount}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warningCount}</p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unresolvedCount}</p>
                <p className="text-xs text-muted-foreground">Unresolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {criticalCount === 0 ? "Healthy" : "Issues"}
                </p>
                <p className="text-xs text-muted-foreground">System Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert List */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="auth_error">Auth</TabsTrigger>
          <TabsTrigger value="payment_failure">Payments</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="edge_function_error">Functions</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4 space-y-3">
          {isLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading alerts...</CardContent></Card>
          ) : alerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-medium">All Clear</p>
                <p className="text-muted-foreground">No alerts found. Systems are healthy.</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => {
              const sev = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info;
              const type = typeConfig[alert.alert_type] || typeConfig.system;
              const TypeIcon = type.icon;

              return (
                <Card key={alert.id} className={alert.resolved ? "opacity-50" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <TypeIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={sev.color}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="secondary">{type.label}</Badge>
                            {alert.resolved && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-700">
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">{alert.title}</p>
                          {alert.details && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {alert.details}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!alert.resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveMutation.mutate(alert.id)}
                          disabled={resolveMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
