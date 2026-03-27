// DO NOT EDIT VIA LOVABLE
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingProgress from "@/onboarding/OnboardingProgress";
import { ensureProfileRow } from "@/lib/profileExtrasApi";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const RIGOR_OPTIONS = [
  "Most rigorous curriculum available at my school",
  "Very rigorous",
  "Rigorous / Above average",
  "Average",
  "Below average",
];

export default function OnboardingAcademicsPage() {
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [gpaUW, setGpaUW] = useState("");
  const [gpaW, setGpaW] = useState("");
  const [sat, setSat] = useState("");
  const [act, setAct] = useState("");
  const [rigor, setRigor] = useState("");
  const [apCount, setApCount] = useState("");

  useEffect(() => {
    (async () => {
      const prof: any = await ensureProfileRow();
      if (prof.gpa_unweighted) setGpaUW(prof.gpa_unweighted.toString());
      if (prof.gpa_weighted) setGpaW(prof.gpa_weighted.toString());
      if (prof.sat_score) setSat(prof.sat_score.toString());
      if (prof.act_score) setAct(prof.act_score.toString());
      if (prof.coursework_rigor) setRigor(prof.coursework_rigor);
    })();
  }, []);

  async function handleNext() {
    setSaving(true);
    setErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      await supabase.from("profiles").update({
        gpa_unweighted: gpaUW ? parseFloat(gpaUW) : null,
        gpa_weighted: gpaW ? parseFloat(gpaW) : null,
        sat_score: sat ? parseInt(sat) : null,
        act_score: act ? parseInt(act) : null,
        coursework_rigor: rigor || null,
      }).eq("id", user.id);
      nav("/onboarding/financial");
    } catch (e: any) {
      setErr(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingProgress active="academics" />
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Academic Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your academic stats power both college admission probability scores and merit-based scholarship matching. Be honest — the app works better with accurate data.
            </p>
          </div>
          {err && <p className="text-destructive text-sm">{err}</p>}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gpa_uw">GPA (unweighted, 4.0 scale)</Label>
                <Input id="gpa_uw" type="number" min={0} max={4.0} step={0.01} placeholder="e.g. 3.75" value={gpaUW} onChange={(e) => setGpaUW(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gpa_w">GPA (weighted, optional)</Label>
                <Input id="gpa_w" type="number" min={0} max={5.0} step={0.01} placeholder="e.g. 4.2" value={gpaW} onChange={(e) => setGpaW(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sat">SAT score (400–1600)</Label>
                <Input id="sat" type="number" min={400} max={1600} step={10} placeholder="e.g. 1280" value={sat} onChange={(e) => setSat(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="act">ACT score (1–36)</Label>
                <Input id="act" type="number" min={1} max={36} placeholder="e.g. 28" value={act} onChange={(e) => setAct(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Leave SAT/ACT blank if you haven't taken them yet.</p>
            <div className="space-y-1.5">
              <Label>Coursework rigor</Label>
              <Select value={rigor} onValueChange={setRigor}>
                <SelectTrigger><SelectValue placeholder="Select your course load level" /></SelectTrigger>
                <SelectContent>
                  {RIGOR_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap_count">Number of AP / IB courses (taken or in progress)</Label>
              <Input id="ap_count" type="number" min={0} max={20} placeholder="e.g. 4" value={apCount} onChange={(e) => setApCount(e.target.value)} />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800 dark:text-emerald-300">Your academic profile unlocks college admission probability scores and merit-based scholarship matches.</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => nav("/onboarding/basics")}>Back</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => nav("/onboarding/financial")}>Skip</Button>
              <Button onClick={handleNext} disabled={saving} className="gap-2 min-w-[140px]">
                {saving ? "Saving..." : "Save & Continue"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
