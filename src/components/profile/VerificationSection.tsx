import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  User,
  Trash2,
  Send,
  Building,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface VerificationRequest {
  id: string;
  type: "transcript" | "recommendation" | "enrollment" | "financial" | "other";
  status: "pending" | "sent" | "received" | "verified";
  recipientName?: string;
  recipientEmail?: string;
  institution?: string;
  requestedAt?: string;
  receivedAt?: string;
  documentUrl?: string;
  notes?: string;
}

export interface VerificationData {
  requests?: VerificationRequest[];
  uploadedDocs?: {
    id: string;
    type: string;
    fileName: string;
    uploadedAt: string;
    url: string;
  }[];
}

interface Props {
  data: VerificationData;
  onChange: (data: VerificationData) => void;
  onSave?: () => void;
}

const DOC_TYPES = [
  { value: "transcript", label: "Official Transcript", icon: FileText },
  { value: "recommendation", label: "Letter of Recommendation", icon: Mail },
  { value: "enrollment", label: "Enrollment Verification", icon: Building },
  { value: "financial", label: "Financial Documentation", icon: FileText },
  { value: "other", label: "Other Document", icon: FileText },
];

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, color: "text-amber-500" },
  sent: { label: "Request Sent", icon: Send, color: "text-blue-500" },
  received: { label: "Received", icon: CheckCircle2, color: "text-green-500" },
  verified: { label: "Verified", icon: ShieldCheck, color: "text-primary" },
};

export default function VerificationSection({ data, onChange, onSave }: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [newRequest, setNewRequest] = useState<Partial<VerificationRequest>>({
    type: "transcript",
    status: "pending",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-media")
        .getPublicUrl(filePath);

      const newDoc = {
        id: crypto.randomUUID(),
        type: newRequest.type || "other",
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        url: urlData.publicUrl,
      };

      onChange({
        ...data,
        uploadedDocs: [...(data.uploadedDocs || []), newDoc],
      });
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addRequest = () => {
    if (!newRequest.type) return;

    const request: VerificationRequest = {
      id: crypto.randomUUID(),
      type: newRequest.type as VerificationRequest["type"],
      status: "pending",
      recipientName: newRequest.recipientName,
      recipientEmail: newRequest.recipientEmail,
      institution: newRequest.institution,
      requestedAt: new Date().toISOString(),
      notes: newRequest.notes,
    };

    onChange({
      ...data,
      requests: [...(data.requests || []), request],
    });

    setNewRequest({ type: "transcript", status: "pending" });
    setShowRequestForm(false);
    onSave?.();
  };

  const updateRequestStatus = (id: string, status: VerificationRequest["status"]) => {
    onChange({
      ...data,
      requests: data.requests?.map((r) =>
        r.id === id
          ? { ...r, status, receivedAt: status === "received" ? new Date().toISOString() : r.receivedAt }
          : r
      ),
    });
    onSave?.();
  };

  const removeRequest = (id: string) => {
    onChange({
      ...data,
      requests: data.requests?.filter((r) => r.id !== id),
    });
  };

  const removeDoc = async (docId: string) => {
    onChange({
      ...data,
      uploadedDocs: data.uploadedDocs?.filter((d) => d.id !== docId),
    });
  };

  const pendingCount = data.requests?.filter((r) => r.status === "pending" || r.status === "sent").length || 0;
  const verifiedCount = data.requests?.filter((r) => r.status === "verified").length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Verification & Documentation</CardTitle>
              <CardDescription>
                Request and track official documents for scholarship applications
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Badge variant="outline" className="text-amber-600">
                {pendingCount} pending
              </Badge>
            )}
            {verifiedCount > 0 && (
              <Badge variant="default">
                {verifiedCount} verified
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Box */}
        <div className="bg-muted/30 rounded-lg p-4 border">
          <h4 className="font-medium text-sm text-foreground mb-2">
            Documents That Strengthen Scholarship Applications
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li><strong>Official Transcripts</strong> - Verify your GPA and coursework</li>
            <li><strong>Letters of Recommendation</strong> - From teachers, counselors, coaches, mentors</li>
            <li><strong>Enrollment Verification</strong> - Proof of current enrollment status</li>
            <li><strong>Financial Documentation</strong> - For need-based scholarships (FAFSA, tax docs)</li>
            <li><strong>Award Certificates</strong> - Academic, athletic, or extracurricular achievements</li>
          </ul>
        </div>

        {/* Verification Requests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-foreground">Document Requests</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRequestForm(!showRequestForm)}
            >
              {showRequestForm ? "Cancel" : "New Request"}
            </Button>
          </div>

          {showRequestForm && (
            <div className="border rounded-lg p-4 mb-4 space-y-4 bg-muted/20">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select
                    value={newRequest.type}
                    onValueChange={(v) => setNewRequest({ ...newRequest, type: v as VerificationRequest["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Institution/Organization</Label>
                  <Input
                    value={newRequest.institution || ""}
                    onChange={(e) => setNewRequest({ ...newRequest, institution: e.target.value })}
                    placeholder="e.g., Lincoln High School"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipient Name</Label>
                  <Input
                    value={newRequest.recipientName || ""}
                    onChange={(e) => setNewRequest({ ...newRequest, recipientName: e.target.value })}
                    placeholder="e.g., Mrs. Johnson (Counselor)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recipient Email</Label>
                  <Input
                    type="email"
                    value={newRequest.recipientEmail || ""}
                    onChange={(e) => setNewRequest({ ...newRequest, recipientEmail: e.target.value })}
                    placeholder="counselor@school.edu"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newRequest.notes || ""}
                  onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                  placeholder="Any special instructions or context..."
                  rows={2}
                />
              </div>

              <Button onClick={addRequest} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Create Request
              </Button>
            </div>
          )}

          {data.requests && data.requests.length > 0 ? (
            <div className="space-y-2">
              {data.requests.map((request) => {
                const statusInfo = STATUS_CONFIG[request.status];
                const StatusIcon = statusInfo.icon;
                const docType = DOC_TYPES.find((d) => d.value === request.type);

                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted`}>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{docType?.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {request.institution && `${request.institution} • `}
                          {request.recipientName || "No recipient specified"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={request.status}
                        onValueChange={(v) => updateRequestStatus(request.id, v as VerificationRequest["status"])}
                      >
                        <SelectTrigger className="w-36 h-8">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                            <span className="text-xs">{statusInfo.label}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <val.icon className={`h-3 w-3 ${val.color}`} />
                                {val.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeRequest(request.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No document requests yet. Create one to track your verification progress.
            </p>
          )}
        </div>

        {/* Upload Documents */}
        <div>
          <h4 className="font-medium text-foreground mb-4">Uploaded Documents</h4>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="hidden"
          />

          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload Document (PDF, JPG, PNG)"}
          </Button>

          {data.uploadedDocs && data.uploadedDocs.length > 0 && (
            <div className="mt-4 space-y-2">
              {data.uploadedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeDoc(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
