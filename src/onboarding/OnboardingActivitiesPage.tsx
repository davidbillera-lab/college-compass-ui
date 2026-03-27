// DO NOT EDIT VIA LOVABLE
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingProgress from "@/onboarding/OnboardingProgress";
import { ensureProfileRow } from "@/lib/profileExtrasApi";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

function TagInput({ value, onChange, placeholder, examples }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string; examples?: string[];
}) {
  const [input, setInput] = useState("");
  function addTag(tag: string) {
    const t = tag.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput("");
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[2rem]">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-destructive/20" onClick={() => onChange(value.filter((t) => t !== tag))}>
            {tag} ×
          </Badge>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(input); } }}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={placeholder || "Type and press Enter"}
      />
      {examples && (
        <div className="flex flex-wrap gap-1 mt-1">
          <span className="text-xs text-muted-foreground mr-1">Examples:</span>
          {examples.map((ex) => (
            <button key={ex} type="button" className="text-xs text-primary underline-offset-2 hover:underline" onClick={() => addTag(ex)}>{ex}</button>
          ))}
        </div>
      )}
    </div>
  );
}

type BoolAnswer = true | false | null;

export default function OnboardingActivitiesPage() {
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [leadership, setLeadership] = useState<string[]>([]);
  const [sports, setSports] = useState<string[]>([]);
  const [volHours, setVolHours] = useState("");
  const [awards, setAwards] = useState<string[]>([]);
  const [playsInstrument, setPlaysInstrument] = useState<BoolAnswer>(null);
  const [stemCompetitions, setStemCompetitions] = useState<BoolAnswer>(null);

  useEffect(() => {
    (async () => {
      const prof: any = await ensureProfileRow();
      if (prof.leadership_roles) setLeadership(prof.leadership_roles);
      if (prof.sports_played) setSports(prof.sports_played);
      if (prof.volunteer_hours) setVolHours(prof.volunteer_hours.toString());
      if (prof.awards) setAwards(prof.awards);
    })();
  }, []);

  async function handleNext() {
    setSaving(true);
    setErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      await supabase.from("profiles").update({
        leadership_roles: leadership.length > 0 ? leadership : null,
        sports_played: sports.length > 0 ? sports : null,
        volunteer_hours: volHours ? parseInt(volHours) : null,
        awards: awards.length > 0 ? awards : null,
      }).eq("id", user.id);
      if (playsInstrument !== null) {
        await supabase.from("scholarship_user_answers").upsert(
          { user_id: user.id, question_key: "plays_instrument", answer_json: { value: playsInstrument } },
          { onConflict: "user_id,question_key" }
        );
      }
      if (stemCompetitions !== null) {
        await supabase.from("scholarship_user_answers").upsert(
          { user_id: user.id, question_key: "stem_competitions", answer_json: { value: stemCompetitions } },
          { onConflict: "user_id,question_key" }
        );
      }
      nav("/onboarding/story");
    } catch (e: any) {
      setErr(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function BoolButtons({ value, onChange }: { value: BoolAnswer; onChange: (v: BoolAnswer) => void }) {
    return (
      <div className="flex gap-2">
        {([{ label: "Yes", v: true }, { label: "No", v: false }] as { label: string; v: BoolAnswer }[]).map(({ label, v }) => (
          <button key={label} type="button" onClick={() => onChange(v)}
            className={cn("flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              value === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
            )}>
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingProgress active="activities" />
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activities & Achievements</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Scholarship committees don't just read your GPA — they read your story. What have you done outside the classroom?
            </p>
          </div>
          {err && <p className="text-destructive text-sm">{err}</p>}

          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label>Leadership roles</Label>
              <TagInput value={leadership} onChange={setLeadership} placeholder="Type a role and press Enter"
                examples={["Student Body President", "Team Captain", "Club Founder", "NHS Officer"]} />
            </div>
            <div className="space-y-1.5">
              <Label>Sports played</Label>
              <TagInput value={sports} onChange={setSports} placeholder="Type a sport and press Enter"
                examples={["Varsity Soccer", "Club Swimming", "Cross Country", "Basketball"]} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vol">Total volunteer hours (estimate)</Label>
              <Input id="vol" type="number" min={0} placeholder="e.g. 150" value={volHours} onChange={(e) => setVolHours(e.target.value)} />
              <p className="text-xs text-muted-foreground">Round to the nearest 25. Includes school, church, community, and personal service.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Awards & honors</Label>
              <TagInput value={awards} onChange={setAwards} placeholder="Type an award and press Enter"
                examples={["National Merit Semifinalist", "Eagle Scout", "State Science Fair Winner", "AP Scholar"]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Do you play a musical instrument?</Label>
                <BoolButtons value={playsInstrument} onChange={setPlaysInstrument} />
              </div>
              <div className="space-y-2">
                <Label>STEM competitions?</Label>
                <BoolButtons value={stemCompetitions} onChange={setStemCompetitions} />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800 dark:text-emerald-300">Activities data unlocks community service, leadership, and talent-based scholarships worth an average of $8,500 each.</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => nav("/onboarding/financial")}>Back</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => nav("/onboarding/story")}>Skip</Button>
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
