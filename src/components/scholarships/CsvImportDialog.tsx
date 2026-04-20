import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileSpreadsheet, Upload, Loader2, CheckCircle, AlertCircle, 
  Download, HelpCircle, X
} from 'lucide-react';
import { toast } from 'sonner';
import { Scholarship, NormalizedCriteria } from '@/lib/scholarshipsIntel/types';
import { updateScholarshipCriteria } from '@/lib/scholarshipsIntel/api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scholarships: Scholarship[];
  onImportComplete: () => void;
}

interface ParsedRow {
  scholarship_name: string;
  matched_scholarship?: Scholarship;
  criteria: NormalizedCriteria;
  status: 'matched' | 'unmatched' | 'error';
  error?: string;
}

// CSV column to criteria field mapping
const COLUMN_MAPPINGS: Record<string, { field: keyof NormalizedCriteria; type: 'number' | 'boolean' | 'string_array' | 'string' }> = {
  'min_gpa': { field: 'min_gpa', type: 'number' },
  'min_sat': { field: 'min_sat', type: 'number' },
  'max_sat': { field: 'max_sat', type: 'number' },
  'min_act': { field: 'min_act', type: 'number' },
  'max_act': { field: 'max_act', type: 'number' },
  'min_psat': { field: 'min_psat', type: 'number' },
  'class_rank_percentile': { field: 'class_rank_percentile', type: 'number' },
  'volunteer_hours_min': { field: 'volunteer_hours_min', type: 'number' },
  'work_experience_hours_min': { field: 'work_experience_hours_min', type: 'number' },
  'min_ap_courses': { field: 'min_ap_courses', type: 'number' },
  'max_family_income': { field: 'max_family_income', type: 'number' },
  'recommendation_letters': { field: 'recommendation_letters', type: 'number' },
  'need_based': { field: 'need_based', type: 'boolean' },
  'merit_based': { field: 'merit_based', type: 'boolean' },
  'first_gen': { field: 'first_gen', type: 'boolean' },
  'pell_eligible': { field: 'pell_eligible', type: 'boolean' },
  'leadership_required': { field: 'leadership_required', type: 'boolean' },
  'community_service_required': { field: 'community_service_required', type: 'boolean' },
  'requires_ap_courses': { field: 'requires_ap_courses', type: 'boolean' },
  'varsity_required': { field: 'varsity_required', type: 'boolean' },
  'requires_awards': { field: 'requires_awards', type: 'boolean' },
  'essay_required': { field: 'essay_required', type: 'boolean' },
  'interview_required': { field: 'interview_required', type: 'boolean' },
  'states': { field: 'states', type: 'string_array' },
  'citizenship': { field: 'citizenship', type: 'string_array' },
  'majors': { field: 'majors', type: 'string_array' },
  'athletics': { field: 'athletics', type: 'string_array' },
  'career_goals': { field: 'career_goals', type: 'string_array' },
  'education_levels': { field: 'education_levels', type: 'string_array' },
  'specific_awards': { field: 'specific_awards', type: 'string_array' },
  'athletic_division': { field: 'athletic_division', type: 'string_array' },
};

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };
  
  // Parse headers
  const headers = parseCSVLine(lines[0]);
  
  // Parse rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header.toLowerCase().trim()] = values[idx]?.trim() || '';
    });
    rows.push(row);
  }
  
  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

function parseValue(value: string, type: 'number' | 'boolean' | 'string_array' | 'string'): unknown {
  if (!value || value.toLowerCase() === 'null' || value === '') return null;
  
  switch (type) {
    case 'number': {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }
    case 'boolean': {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === 'yes' || lower === '1') return true;
      if (lower === 'false' || lower === 'no' || lower === '0') return false;
      return null;
    }
    case 'string_array':
      return value.split(';').map(s => s.trim()).filter(Boolean);
    case 'string':
      return value;
    default:
      return value;
  }
}

function matchScholarship(name: string, scholarships: Scholarship[]): Scholarship | undefined {
  const normalized = name.toLowerCase().trim();
  
  // Exact match first
  const exact = scholarships.find(s => s.name.toLowerCase() === normalized);
  if (exact) return exact;
  
  // Partial match
  const partial = scholarships.find(s => 
    s.name.toLowerCase().includes(normalized) || 
    normalized.includes(s.name.toLowerCase())
  );
  return partial;
}

export function CsvImportDialog({ 
  open, 
  onOpenChange, 
  scholarships, 
  onImportComplete 
}: CsvImportDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [parsedRows, setParsedRows] = React.useState<ParsedRow[]>([]);
  const [importing, setImporting] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    
    setFile(selectedFile);
    
    try {
      const text = await selectedFile.text();
      const { headers, rows } = parseCSV(text);
      
      if (!headers.map(h => h.toLowerCase()).includes('scholarship_name')) {
        toast.error('CSV must have a "scholarship_name" column');
        return;
      }
      
      const parsed: ParsedRow[] = rows.map(row => {
        const scholarshipName = row['scholarship_name'];
        if (!scholarshipName) {
          return {
            scholarship_name: '(empty)',
            criteria: {},
            status: 'error' as const,
            error: 'Missing scholarship name',
          };
        }
        
        const matched = matchScholarship(scholarshipName, scholarships);
        const criteria: NormalizedCriteria = {};
        
        // Parse each column
        for (const [column, mapping] of Object.entries(COLUMN_MAPPINGS)) {
          const value = row[column];
          if (value) {
            const parsed = parseValue(value, mapping.type);
            if (parsed !== null) {
              (criteria as Record<string, unknown>)[mapping.field] = parsed;
            }
          }
        }
        
        // Handle demographics_optional specially
        const demographics: Record<string, unknown> = {};
        if (row['demographics_race']) {
          demographics.race = row['demographics_race'].split(';').map(s => s.trim());
        }
        if (row['demographics_gender']) {
          demographics.gender = row['demographics_gender'].split(';').map(s => s.trim());
        }
        if (row['demographics_religion']) {
          demographics.religion = row['demographics_religion'].split(';').map(s => s.trim());
        }
        if (row['demographics_military'] === 'true') {
          demographics.military_affiliated = true;
        }
        if (row['demographics_disability'] === 'true') {
          demographics.disability = true;
        }
        if (row['demographics_lgbtq'] === 'true') {
          demographics.lgbtq = true;
        }
        
        if (Object.keys(demographics).length > 0) {
          criteria.demographics_optional = demographics as NormalizedCriteria['demographics_optional'];
        }
        
        return {
          scholarship_name: scholarshipName,
          matched_scholarship: matched,
          criteria,
          status: matched ? 'matched' as const : 'unmatched' as const,
        };
      });
      
      setParsedRows(parsed);
      toast.success(`Parsed ${parsed.length} rows`);
    } catch (err) {
      console.error('Error parsing CSV:', err);
      toast.error('Failed to parse CSV file');
    }
  };
  
  const handleImport = async () => {
    const matchedRows = parsedRows.filter(r => r.status === 'matched' && r.matched_scholarship);
    if (matchedRows.length === 0) {
      toast.error('No matched scholarships to import');
      return;
    }
    
    setImporting(true);
    setImportProgress(0);
    
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < matchedRows.length; i++) {
      const row = matchedRows[i];
      try {
        // Merge with existing criteria
        const existingCriteria = row.matched_scholarship!.normalized_criteria || {};
        const mergedCriteria = { ...existingCriteria, ...row.criteria };
        
        await updateScholarshipCriteria(row.matched_scholarship!.id, mergedCriteria);
        success++;
      } catch (err) {
        console.error('Error updating scholarship:', err);
        failed++;
      }
      setImportProgress(Math.round(((i + 1) / matchedRows.length) * 100));
    }
    
    setImporting(false);
    toast.success(`Imported ${success} scholarships${failed > 0 ? `, ${failed} failed` : ''}`);
    onImportComplete();
    onOpenChange(false);
    
    // Reset state
    setFile(null);
    setParsedRows([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const downloadTemplate = () => {
    const headers = [
      'scholarship_name',
      'min_gpa',
      'min_sat',
      'min_act',
      'min_psat',
      'class_rank_percentile',
      'states',
      'citizenship',
      'majors',
      'athletics',
      'need_based',
      'merit_based',
      'first_gen',
      'pell_eligible',
      'leadership_required',
      'community_service_required',
      'volunteer_hours_min',
      'work_experience_hours_min',
      'varsity_required',
      'requires_awards',
      'demographics_race',
      'demographics_gender',
      'demographics_military',
      'demographics_disability',
    ];
    
    const exampleRow = [
      'Gates Scholarship',
      '3.3',
      '',
      '',
      '',
      '',
      '',
      'US Citizen;Permanent Resident',
      '',
      '',
      'true',
      '',
      '',
      'true',
      'true',
      'true',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ];
    
    const csv = [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scholarship_criteria_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const matchedCount = parsedRows.filter(r => r.status === 'matched').length;
  const unmatchedCount = parsedRows.filter(r => r.status === 'unmatched').length;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Scholarship Criteria
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk-update scholarship eligibility criteria
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* File Upload */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Template
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download a template CSV with all supported columns</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Instructions */}
          {parsedRows.length === 0 && (
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">CSV Format Requirements:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li><code className="bg-muted px-1 rounded">scholarship_name</code> column is required (must match existing scholarships)</li>
                  <li>Use semicolons (;) to separate multiple values in array fields</li>
                  <li>Boolean fields accept: true/false, yes/no, 1/0</li>
                  <li>Leave cells empty to skip updating that field</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <>
              <div className="flex items-center gap-4">
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {matchedCount} matched
                </Badge>
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {unmatchedCount} unmatched
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Only matched scholarships will be imported
                </span>
              </div>
              
              <ScrollArea className="flex-1 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Status</TableHead>
                      <TableHead>Scholarship Name</TableHead>
                      <TableHead>Matched To</TableHead>
                      <TableHead>Criteria Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.slice(0, 50).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {row.status === 'matched' ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : row.status === 'error' ? (
                            <X className="h-4 w-4 text-destructive" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{row.scholarship_name}</TableCell>
                        <TableCell>
                          {row.matched_scholarship ? (
                            <span className="text-sm">{row.matched_scholarship.name}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not found</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(row.criteria).slice(0, 3).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {String(Array.isArray(value) ? value.join(', ') : value)}
                              </Badge>
                            ))}
                            {Object.keys(row.criteria).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{Object.keys(row.criteria).length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedRows.length > 50 && (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Showing first 50 of {parsedRows.length} rows
                  </div>
                )}
              </ScrollArea>
            </>
          )}
          
          {/* Import Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Importing... {importProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={importing || matchedCount === 0}
          >
            {importing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" />Import {matchedCount} Scholarships</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
