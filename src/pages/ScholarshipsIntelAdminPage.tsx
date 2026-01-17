import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Archive, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { isUserAdmin, triggerIngestion, fetchScholarships, toggleScholarshipStatus } from '@/lib/scholarshipsIntel/api';
import { Scholarship } from '@/lib/scholarshipsIntel/types';

export default function ScholarshipsIntelAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [url, setUrl] = useState('');
  const [maxPages, setMaxPages] = useState(10);
  const [ingesting, setIngesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);

  useEffect(() => {
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

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Scholarship Admin</h1>
      
      <Card className="mb-6">
        <CardHeader><CardTitle>Firecrawl Ingestion</CardTitle></CardHeader>
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
        <CardHeader><CardTitle>Recent Scholarships ({scholarships.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scholarships.slice(0, 50).map(s => (
              <div key={s.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <span className="font-medium">{s.name}</span>
                  <Badge variant={s.status === 'archived' ? 'secondary' : 'default'} className="ml-2">{s.status || 'active'}</Badge>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(s.id, s.status || 'active')}>
                  {s.status === 'archived' ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
