import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Loader2, Upload, Archive, RotateCcw, Plus, Pencil, 
  GraduationCap, DollarSign, MapPin, Trophy, Users, Briefcase,
  Search, X, Save, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  isUserAdmin, triggerIngestion, fetchScholarships, 
  toggleScholarshipStatus, updateScholarshipCriteria 
} from '@/lib/scholarshipsIntel/api';
import { Scholarship, NormalizedCriteria } from '@/lib/scholarshipsIntel/types';

// US States for dropdown
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const COMMON_MAJORS = [
  'STEM', 'Engineering', 'Computer Science', 'Business', 'Medicine', 'Nursing',
  'Education', 'Law', 'Arts', 'Humanities', 'Social Sciences', 'Biology',
  'Chemistry', 'Physics', 'Mathematics', 'Psychology', 'Communications',
  'Environmental Science', 'Agriculture', 'Architecture', 'Music', 'Theater'
];

const COMMON_SPORTS = [
  'Football', 'Basketball', 'Baseball', 'Soccer', 'Tennis', 'Golf', 
  'Swimming', 'Track and Field', 'Volleyball', 'Softball', 'Wrestling',
  'Cross Country', 'Lacrosse', 'Hockey', 'Gymnastics', 'Rowing', 'Skiing'
];

const CITIZENSHIP_OPTIONS = [
  'US Citizen', 'Permanent Resident', 'DACA', 'International', 'Refugee'
];

interface CriteriaEditorProps {
  scholarship: Scholarship;
  onSave: (criteria: NormalizedCriteria) => Promise<void>;
  onClose: () => void;
}

function CriteriaEditor({ scholarship, onSave, onClose }: CriteriaEditorProps) {
  const [criteria, setCriteria] = React.useState<NormalizedCriteria>(
    scholarship.normalized_criteria || {}
  );
  const [saving, setSaving] = React.useState(false);
  
  // Helper to update criteria
  const updateField = <K extends keyof NormalizedCriteria>(
    field: K, 
    value: NormalizedCriteria[K]
  ) => {
    setCriteria(prev => ({ ...prev, [field]: value }));
  };
  
  // Helper for array fields
  const toggleArrayItem = (field: keyof NormalizedCriteria, item: string) => {
    const current = (criteria[field] as string[] | undefined) || [];
    if (current.includes(item)) {
      updateField(field, current.filter(i => i !== item) as never);
    } else {
      updateField(field, [...current, item] as never);
    }
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(criteria);
      toast.success('Criteria saved!');
      onClose();
    } catch (err) {
      console.error('Error saving criteria:', err);
      toast.error('Failed to save criteria');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Pencil className="h-5 w-5" />
          Edit Criteria: {scholarship.name}
        </DialogTitle>
      </DialogHeader>
      
      <ScrollArea className="flex-1 pr-4">
        <Tabs defaultValue="academic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
          </TabsList>
          
          {/* Academic Tab */}
          <TabsContent value="academic" className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum GPA</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="4"
                  value={criteria.min_gpa ?? ''}
                  onChange={e => updateField('min_gpa', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 3.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Class Rank Percentile (Top X%)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={criteria.class_rank_percentile ?? ''}
                  onChange={e => updateField('class_rank_percentile', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 10 for top 10%"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Minimum SAT Score</Label>
                <Input
                  type="number"
                  min="400"
                  max="1600"
                  value={criteria.min_sat ?? ''}
                  onChange={e => updateField('min_sat', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 1200"
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum ACT Score</Label>
                <Input
                  type="number"
                  min="1"
                  max="36"
                  value={criteria.min_act ?? ''}
                  onChange={e => updateField('min_act', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 25"
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum PSAT Score</Label>
                <Input
                  type="number"
                  min="320"
                  max="1520"
                  value={criteria.min_psat ?? ''}
                  onChange={e => updateField('min_psat', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 1100"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Switch
                  checked={criteria.requires_ap_courses ?? false}
                  onCheckedChange={v => updateField('requires_ap_courses', v)}
                />
                <Label>Requires AP Courses</Label>
              </div>
              {criteria.requires_ap_courses && (
                <div className="ml-8">
                  <Label>Minimum AP Courses</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={criteria.min_ap_courses ?? ''}
                    onChange={e => updateField('min_ap_courses', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="e.g., 3"
                    className="w-32"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Preferred Majors</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_MAJORS.map(major => (
                  <Badge
                    key={major}
                    variant={(criteria.majors || []).includes(major) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('majors', major)}
                  >
                    {major}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <Switch
                  checked={criteria.need_based ?? false}
                  onCheckedChange={v => updateField('need_based', v)}
                />
                <div>
                  <Label>Need-Based</Label>
                  <p className="text-sm text-muted-foreground">Requires demonstrated financial need</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Switch
                  checked={criteria.merit_based ?? false}
                  onCheckedChange={v => updateField('merit_based', v)}
                />
                <div>
                  <Label>Merit-Based</Label>
                  <p className="text-sm text-muted-foreground">Based on academic achievement</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Switch
                  checked={criteria.first_gen ?? false}
                  onCheckedChange={v => updateField('first_gen', v)}
                />
                <div>
                  <Label>First-Generation</Label>
                  <p className="text-sm text-muted-foreground">First in family to attend college</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Switch
                  checked={criteria.pell_eligible ?? false}
                  onCheckedChange={v => updateField('pell_eligible', v)}
                />
                <div>
                  <Label>Pell Grant Eligible</Label>
                  <p className="text-sm text-muted-foreground">Must qualify for Pell Grant</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Maximum Family Income</Label>
              <Input
                type="number"
                min="0"
                value={criteria.max_family_income ?? ''}
                onChange={e => updateField('max_family_income', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g., 80000"
              />
            </div>
          </TabsContent>
          
          {/* Location Tab */}
          <TabsContent value="location" className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label>Required States (select all that apply)</Label>
              <div className="flex flex-wrap gap-2 p-4 border rounded-md max-h-48 overflow-y-auto">
                {US_STATES.map(state => (
                  <Badge
                    key={state}
                    variant={(criteria.states || []).includes(state) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('states', state)}
                  >
                    {state}
                  </Badge>
                ))}
              </div>
              {(criteria.states || []).length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  Selected: {(criteria.states || []).join(', ')}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateField('states', [])}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Citizenship Requirements</Label>
              <div className="flex flex-wrap gap-2">
                {CITIZENSHIP_OPTIONS.map(opt => (
                  <Badge
                    key={opt}
                    variant={(criteria.citizenship || []).includes(opt) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('citizenship', opt)}
                  >
                    {opt}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <Switch
                  checked={criteria.leadership_required ?? false}
                  onCheckedChange={v => updateField('leadership_required', v)}
                />
                <div>
                  <Label>Leadership Required</Label>
                  <p className="text-sm text-muted-foreground">Must have leadership experience</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Switch
                  checked={criteria.community_service_required ?? false}
                  onCheckedChange={v => updateField('community_service_required', v)}
                />
                <div>
                  <Label>Community Service Required</Label>
                  <p className="text-sm text-muted-foreground">Must have volunteer experience</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Switch
                  checked={criteria.requires_awards ?? false}
                  onCheckedChange={v => updateField('requires_awards', v)}
                />
                <div>
                  <Label>Awards Required</Label>
                  <p className="text-sm text-muted-foreground">Must have academic/extracurricular awards</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Switch
                  checked={criteria.varsity_required ?? false}
                  onCheckedChange={v => updateField('varsity_required', v)}
                />
                <div>
                  <Label>Varsity Athlete</Label>
                  <p className="text-sm text-muted-foreground">Must be varsity level</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Volunteer Hours</Label>
                <Input
                  type="number"
                  min="0"
                  value={criteria.volunteer_hours_min ?? ''}
                  onChange={e => updateField('volunteer_hours_min', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 100"
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Work Experience Hours</Label>
                <Input
                  type="number"
                  min="0"
                  value={criteria.work_experience_hours_min ?? ''}
                  onChange={e => updateField('work_experience_hours_min', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 200"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Athletic Sports (for athletic scholarships)</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_SPORTS.map(sport => (
                  <Badge
                    key={sport}
                    variant={(criteria.athletics || []).includes(sport) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('athletics', sport)}
                  >
                    {sport}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-6 pt-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Demographic criteria are treated as <strong>optional boosters</strong> - matching students get a score boost, 
                but non-matching students are not disqualified.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <Switch
                  checked={criteria.demographics_optional?.military_affiliated ?? false}
                  onCheckedChange={v => updateField('demographics_optional', {
                    ...criteria.demographics_optional,
                    military_affiliated: v
                  })}
                />
                <div>
                  <Label>Military Affiliated</Label>
                  <p className="text-sm text-muted-foreground">Veterans or military families</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Switch
                  checked={criteria.demographics_optional?.disability ?? false}
                  onCheckedChange={v => updateField('demographics_optional', {
                    ...criteria.demographics_optional,
                    disability: v
                  })}
                />
                <div>
                  <Label>Students with Disabilities</Label>
                  <p className="text-sm text-muted-foreground">For students with documented disabilities</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Gender Preferences</Label>
              <div className="flex flex-wrap gap-2">
                {['Female', 'Male', 'Non-binary'].map(gender => {
                  const current = criteria.demographics_optional?.gender || [];
                  return (
                    <Badge
                      key={gender}
                      variant={current.includes(gender) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const updated = current.includes(gender)
                          ? current.filter(g => g !== gender)
                          : [...current, gender];
                        updateField('demographics_optional', {
                          ...criteria.demographics_optional,
                          gender: updated
                        });
                      }}
                    >
                      {gender}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Raw Eligibility Reference */}
        {scholarship.raw_eligibility_text && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <Label className="text-sm font-medium">Original Eligibility Text (Reference)</Label>
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
              {scholarship.raw_eligibility_text}
            </p>
          </div>
        )}
      </ScrollArea>
      
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Criteria
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default function ScholarshipsIntelAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [url, setUrl] = React.useState('');
  const [maxPages, setMaxPages] = React.useState(10);
  const [ingesting, setIngesting] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [scholarships, setScholarships] = React.useState<Scholarship[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [editingScholarship, setEditingScholarship] = React.useState<Scholarship | null>(null);

  React.useEffect(() => {
    async function checkAdmin() {
      if (!user) { navigate('/auth'); return; }
      const admin = await isUserAdmin(user.id);
      if (!admin) { toast.error('Admin access required'); navigate('/scholarships-intel'); return; }
      setIsAdmin(true);
      const schols = await fetchScholarships();
      setScholarships(schols);
      setLoading(false);
    }
    checkAdmin();
  }, [user, navigate]);

  const handleIngest = async () => {
    if (!url) { toast.error('Enter a URL'); return; }
    setIngesting(true);
    setResult(null);
    try {
      const res = await triggerIngestion(url, maxPages);
      setResult(res.message);
      if (res.success) {
        toast.success('Ingestion complete!');
        const schols = await fetchScholarships();
        setScholarships(schols);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error('Ingestion failed');
    } finally {
      setIngesting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'archived' ? 'active' : 'archived';
    try {
      await toggleScholarshipStatus(id, newStatus);
      setScholarships(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
      toast.success(`Scholarship ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveCriteria = async (criteria: NormalizedCriteria) => {
    if (!editingScholarship) return;
    await updateScholarshipCriteria(editingScholarship.id, criteria);
    setScholarships(prev => prev.map(s => 
      s.id === editingScholarship.id ? { ...s, normalized_criteria: criteria } : s
    ));
  };

  const filteredScholarships = scholarships.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.provider?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count scholarships with criteria configured
  const configuredCount = scholarships.filter(s => 
    s.normalized_criteria && Object.keys(s.normalized_criteria).length > 0
  ).length;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scholarship Admin</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {scholarships.length} total
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {configuredCount} configured
          </Badge>
        </div>
      </div>
      
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Firecrawl Ingestion</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Start URL</Label>
              <Input placeholder="https://example.com/scholarships" value={url} onChange={e => setUrl(e.target.value)} />
            </div>
            <div>
              <Label>Max Pages</Label>
              <Input type="number" value={maxPages} onChange={e => setMaxPages(parseInt(e.target.value) || 10)} />
            </div>
          </div>
          <Button onClick={handleIngest} disabled={ingesting}>
            {ingesting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Crawling...</> : <><Upload className="h-4 w-4 mr-2" />Ingest Scholarships</>}
          </Button>
          {result && <div className="p-3 bg-muted rounded text-sm">{result}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Scholarship Database
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scholarships..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filteredScholarships.map(s => {
                const hasCriteria = s.normalized_criteria && Object.keys(s.normalized_criteria).length > 0;
                const amount = s.amount_max_usd || s.amount_min_usd || s.amount_usd;
                
                return (
                  <div 
                    key={s.id} 
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{s.name}</span>
                        <Badge variant={s.status === 'archived' ? 'secondary' : 'default'} className="text-xs">
                          {s.status || 'active'}
                        </Badge>
                        {hasCriteria ? (
                          <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Needs criteria
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        {s.provider && <span>{s.provider}</span>}
                        {amount && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {amount.toLocaleString()}
                          </span>
                        )}
                        {s.deadline_date && (
                          <span>Due: {new Date(s.deadline_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingScholarship(s)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit Criteria
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleToggleStatus(s.id, s.status || 'active')}
                      >
                        {s.status === 'archived' ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Criteria Editor Dialog */}
      <Dialog open={!!editingScholarship} onOpenChange={(open) => !open && setEditingScholarship(null)}>
        {editingScholarship && (
          <CriteriaEditor
            scholarship={editingScholarship}
            onSave={handleSaveCriteria}
            onClose={() => setEditingScholarship(null)}
          />
        )}
      </Dialog>
    </div>
  );
}
