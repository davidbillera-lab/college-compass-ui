import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, ExternalLink, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { fetchScholarships, fetchScholarshipQuestions, fetchUserAnswers, fetchProfile, recalculateMatches, addToPipeline, fetchPipelineStatuses, upsertUserAnswer } from '@/lib/scholarshipsIntel/api';
import { getMostImpactfulQuestions } from '@/lib/scholarshipsIntel/matching';
import { Scholarship, ScholarshipQuestion, ScholarshipUserAnswer, MatchResult, Profile } from '@/lib/scholarshipsIntel/types';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type SortOption = 'score' | 'deadline' | 'amount';

export default function ScholarshipsIntelPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [matches, setMatches] = useState<Map<string, MatchResult>>(new Map());
  const [questions, setQuestions] = useState<ScholarshipQuestion[]>([]);
  const [answers, setAnswers] = useState<ScholarshipUserAnswer[]>([]);
  const [pipelineIds, setPipelineIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [tab, setTab] = useState('eligible');
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [schols, qs, ans] = await Promise.all([
        fetchScholarships(),
        fetchScholarshipQuestions(),
        fetchUserAnswers(user.id),
      ]);
      setScholarships(schols);
      setQuestions(qs);
      setAnswers(ans);
      
      const matchResults = await recalculateMatches(user.id);
      setMatches(matchResults);
      
      const pipeIds = await fetchPipelineStatuses(user.id, schols.map(s => s.id));
      setPipelineIds(pipeIds);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load scholarships');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddToPipeline = async (scholarshipId: string) => {
    if (!user) return;
    try {
      await addToPipeline(user.id, scholarshipId);
      setPipelineIds(prev => new Set([...prev, scholarshipId]));
      toast.success('Added to pipeline!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add');
    }
  };

  const handleAnswerChange = async (key: string, value: unknown) => {
    if (!user) return;
    try {
      await upsertUserAnswer(user.id, key, value);
      setAnswers(prev => {
        const existing = prev.find(a => a.question_key === key);
        if (existing) {
          return prev.map(a => a.question_key === key ? { ...a, answer_json: value } : a);
        }
        return [...prev, { id: '', user_id: user.id, question_key: key, answer_json: value, updated_at: new Date().toISOString() }];
      });
      // Recalculate matches
      const newMatches = await recalculateMatches(user.id);
      setMatches(newMatches);
    } catch (err) {
      toast.error('Failed to save answer');
    }
  };

  const filteredScholarships = scholarships.filter(s => {
    const match = matches.get(s.id);
    if (tab === 'eligible') return match?.eligibility_status === 'eligible';
    if (tab === 'maybe') return match?.eligibility_status === 'maybe';
    return true;
  }).sort((a, b) => {
    const ma = matches.get(a.id);
    const mb = matches.get(b.id);
    if (sortBy === 'score') return (mb?.score || 0) - (ma?.score || 0);
    if (sortBy === 'deadline') {
      const da = a.deadline_date || a.deadline || '9999';
      const db = b.deadline_date || b.deadline || '9999';
      return da.localeCompare(db);
    }
    if (sortBy === 'amount') {
      return (b.amount_max_usd || b.amount_usd || 0) - (a.amount_max_usd || a.amount_usd || 0);
    }
    return 0;
  });

  const impactfulQuestions = getMostImpactfulQuestions(matches, 5);
  const priorityQuestions = questions.filter(q => impactfulQuestions.some(iq => iq.field === q.key));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Scholarship Intelligence</h1>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Best Match</SelectItem>
            <SelectItem value="deadline">Deadline Soon</SelectItem>
            <SelectItem value="amount">Highest Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="eligible">Eligible ({scholarships.filter(s => matches.get(s.id)?.eligibility_status === 'eligible').length})</TabsTrigger>
              <TabsTrigger value="maybe">Maybe ({scholarships.filter(s => matches.get(s.id)?.eligibility_status === 'maybe').length})</TabsTrigger>
              <TabsTrigger value="all">All ({scholarships.length})</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4 space-y-3">
              {filteredScholarships.length === 0 ? (
                <p className="text-muted-foreground">No scholarships found. Answer more questions to unlock matches!</p>
              ) : filteredScholarships.map(s => {
                const match = matches.get(s.id);
                return (
                  <Card key={s.id} className="cursor-pointer hover:bg-accent/50 transition" onClick={() => setSelectedScholarship(s)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{s.name}</h3>
                            <Badge variant={match?.eligibility_status === 'eligible' ? 'default' : match?.eligibility_status === 'maybe' ? 'secondary' : 'destructive'}>
                              {match?.score || 0}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {s.amount_max_usd ? `$${s.amount_min_usd?.toLocaleString() || s.amount_max_usd.toLocaleString()} - $${s.amount_max_usd.toLocaleString()}` : s.amount_usd ? `$${s.amount_usd.toLocaleString()}` : 'Amount varies'}
                            {' • '}
                            {s.rolling_deadline ? 'Rolling deadline' : s.deadline_date || s.deadline ? new Date(s.deadline_date || s.deadline!).toLocaleDateString() : 'No deadline'}
                          </p>
                          {match?.reasons.slice(0, 2).map((r, i) => (
                            <p key={i} className="text-xs text-muted-foreground mt-1">{r}</p>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          {pipelineIds.has(s.id) ? (
                            <Badge variant="outline">In Pipeline</Badge>
                          ) : (
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAddToPipeline(s.id); }}>
                              <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle className="text-lg">Unlock More Matches</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {priorityQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">All key questions answered!</p>
              ) : priorityQuestions.map(q => {
                const answer = answers.find(a => a.question_key === q.key);
                const impact = impactfulQuestions.find(iq => iq.field === q.key);
                return (
                  <div key={q.key} className="space-y-2">
                    <Label className="text-sm font-medium">{q.question_text}</Label>
                    {impact && <p className="text-xs text-muted-foreground">Answering unlocks ~{impact.count} scholarships</p>}
                    {q.answer_type === 'boolean' && (
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2"><input type="radio" checked={answer?.answer_json === true} onChange={() => handleAnswerChange(q.key, true)} /> Yes</label>
                        <label className="flex items-center gap-2"><input type="radio" checked={answer?.answer_json === false} onChange={() => handleAnswerChange(q.key, false)} /> No</label>
                        {q.applies_to?.sensitive && <label className="flex items-center gap-2"><input type="radio" checked={answer?.answer_json === 'prefer_not_to_say'} onChange={() => handleAnswerChange(q.key, 'prefer_not_to_say')} /> Prefer not to say</label>}
                      </div>
                    )}
                    {q.answer_type === 'number' && (
                      <Input type="number" value={answer?.answer_json as number || ''} onChange={(e) => handleAnswerChange(q.key, parseInt(e.target.value) || 0)} />
                    )}
                    {q.answer_type === 'select' && q.options && (
                      <Select value={answer?.answer_json as string || ''} onValueChange={(v) => handleAnswerChange(q.key, v)}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {q.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                          {q.applies_to?.sensitive && <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>}
                        </SelectContent>
                      </Select>
                    )}
                    {q.answer_type === 'multiselect' && q.options && (
                      <div className="flex flex-wrap gap-2">
                        {q.options.slice(0, 6).map(opt => (
                          <label key={opt} className="flex items-center gap-1 text-sm">
                            <Checkbox checked={(answer?.answer_json as string[] || []).includes(opt)} onCheckedChange={(checked) => {
                              const current = (answer?.answer_json as string[] || []);
                              handleAnswerChange(q.key, checked ? [...current, opt] : current.filter(v => v !== opt));
                            }} />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedScholarship && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setSelectedScholarship(null)}>
          <div className="bg-background w-full max-w-md h-full overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{selectedScholarship.name}</h2>
            {selectedScholarship.provider && <p className="text-muted-foreground mb-2">By {selectedScholarship.provider}</p>}
            <div className="space-y-4">
              <div><strong>Amount:</strong> {selectedScholarship.amount_max_usd ? `$${selectedScholarship.amount_min_usd?.toLocaleString()} - $${selectedScholarship.amount_max_usd.toLocaleString()}` : selectedScholarship.amount_usd ? `$${selectedScholarship.amount_usd.toLocaleString()}` : 'Varies'}</div>
              <div><strong>Deadline:</strong> {selectedScholarship.rolling_deadline ? 'Rolling' : selectedScholarship.deadline_date || selectedScholarship.deadline || 'Not specified'}</div>
              {matches.get(selectedScholarship.id)?.reasons.map((r, i) => <p key={i} className="text-sm">{r}</p>)}
              {selectedScholarship.raw_eligibility_text && <div className="text-sm bg-muted p-3 rounded">{selectedScholarship.raw_eligibility_text.substring(0, 500)}...</div>}
              <div className="flex gap-2">
                {selectedScholarship.url && <Button variant="outline" onClick={() => window.open(selectedScholarship.url!, '_blank')}><ExternalLink className="h-4 w-4 mr-2" />Visit Site</Button>}
                {!pipelineIds.has(selectedScholarship.id) && <Button onClick={() => handleAddToPipeline(selectedScholarship.id)}><Plus className="h-4 w-4 mr-2" />Add to Pipeline</Button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
