import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard, FileText, ShoppingCart, BarChart2,
  Search, Settings, Eye, Download, Plus, Trash2, BookOpen, LogOut, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  useGetAdminStats, useListDocuments, useListAmazonProducts, useListMockTests,
  useDeleteDocument, useDeleteAmazonProduct, useDeleteMockTest,
  useCreateDocument, useCreateAmazonProduct, useCreateMockTest,
  getGetAdminStatsQueryKey, getListDocumentsQueryKey, getListAmazonProductsQueryKey, getListMockTestsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type AdminTab = "overview" | "documents" | "materials" | "mock-tests" | "traffic" | "searches" | "settings";

const NAV = [
  { id: "overview" as AdminTab, label: "Overview", icon: LayoutDashboard },
  { id: "documents" as AdminTab, label: "Documents", icon: FileText },
  { id: "materials" as AdminTab, label: "Materials", icon: ShoppingCart },
  { id: "mock-tests" as AdminTab, label: "Mock Tests", icon: ClipboardList },
  { id: "traffic" as AdminTab, label: "Traffic", icon: BarChart2 },
  { id: "searches" as AdminTab, label: "Searches", icon: Search },
  { id: "settings" as AdminTab, label: "Settings", icon: Settings },
];

const CATEGORY_LABELS: Record<string, string> = {
  "notes": "Notes",
  "investigatory-projects": "Investigatory Projects",
  "question-papers": "Question Papers",
  "free-book-pdfs": "Free Book PDFs",
  "practical-files-class-12": "Practical Files Class 12",
  "materials": "Materials",
};

export function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const { toast } = useToast();
  const qc = useQueryClient();
  const ADMIN_EMAIL = "kartik1911k@gmail.com";

  // Guard: check admin using Supabase
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== ADMIN_EMAIL) {
        setLocation("/login");
      }
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session || session.user.email !== ADMIN_EMAIL) {
        setLocation("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [setLocation]);

  const { data: stats } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });
  const { data: docs } = useListDocuments({}, { query: { queryKey: getListDocumentsQueryKey({}) } });
  const { data: products } = useListAmazonProducts({ query: { queryKey: getListAmazonProductsQueryKey() } });
  const { data: mockTests } = useListMockTests({ query: { queryKey: getListMockTestsQueryKey() } });

  const deleteDoc = useDeleteDocument();
  const deleteProduct = useDeleteAmazonProduct();
  const deleteMockTest = useDeleteMockTest();
  const createDoc = useCreateDocument();
  const createProduct = useCreateAmazonProduct();
  const createMockTest = useCreateMockTest();

  // Add Document form state
  const [docForm, setDocForm] = useState({ title: "", description: "", category: "notes", fileType: "pdf", isFree: true, price: "", fileUrl: "", wordFileUrl: "", thumbnailUrl: "" });
  const [amazonForm, setAmazonForm] = useState({ title: "", description: "", affiliateUrl: "", imageUrl: "", price: "" });
  const [mockTestForm, setMockTestForm] = useState({ title: "", description: "", subject: "", duration: "30" });
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  
  // File upload state
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docWordFile, setDocWordFile] = useState<File | null>(null);
  const [docThumbnail, setDocThumbnail] = useState<File | null>(null);
  const [amazonImage, setAmazonImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDeleteDoc = (id: number) => {
    deleteDoc.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Document deleted" });
        qc.invalidateQueries({ queryKey: getListDocumentsQueryKey({}) });
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      },
    });
  };

  const handleDeleteProduct = (id: number) => {
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Product deleted" });
        qc.invalidateQueries({ queryKey: getListAmazonProductsQueryKey() });
      },
    });
  };

  const uploadFile = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    setUploadProgress(0);

    console.log(`Uploading file: ${file.name} to ${folder}/${fileName}`);

    const { error: uploadError, data } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('Upload successful:', data);

    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrlData.publicUrl);

    setUploadProgress(100);

    return publicUrlData.publicUrl;
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(0);

    console.log('Starting document upload with form data:', docForm);
    console.log('Files to upload:', { docFile: docFile?.name, docWordFile: docWordFile?.name, docThumbnail: docThumbnail?.name });

    try {
      let fileUrl = docForm.fileUrl;
      let wordFileUrl = docForm.wordFileUrl;
      let thumbnailUrl = docForm.thumbnailUrl;

      // Upload document file if provided
      if (docFile) {
        setUploadProgress(20);
        console.log('Uploading document file...');
        fileUrl = await uploadFile(docFile, 'documents');
        console.log('Document file uploaded:', fileUrl);
        setUploadProgress(40);
      }

      // Upload Word file if provided
      if (docWordFile) {
        setUploadProgress(50);
        console.log('Uploading Word file...');
        wordFileUrl = await uploadFile(docWordFile, 'word-files');
        console.log('Word file uploaded:', wordFileUrl);
        setUploadProgress(60);
      }

      // Upload thumbnail if provided
      if (docThumbnail) {
        setUploadProgress(80);
        console.log('Uploading thumbnail...');
        thumbnailUrl = await uploadFile(docThumbnail, 'thumbnails');
        console.log('Thumbnail uploaded:', thumbnailUrl);
      }

      setUploadProgress(90);

      const docData = {
        title: docForm.title,
        description: docForm.description,
        category: docForm.category,
        fileType: docForm.fileType,
        isFree: docForm.isFree,
        price: docForm.isFree ? null : parseInt(docForm.price, 10) || null,
        fileUrl: fileUrl || null,
        wordFileUrl: wordFileUrl || null,
        thumbnailUrl: thumbnailUrl || null,
      };

      console.log('Creating document with data:', docData);

      createDoc.mutate({
        data: docData
      }, {
        onSuccess: () => {
          setUploadProgress(100);
          toast({ title: "Document added!" });
          setDocForm({ title: "", description: "", category: "notes", fileType: "pdf", isFree: true, price: "", fileUrl: "", wordFileUrl: "", thumbnailUrl: "" });
          setDocFile(null);
          setDocWordFile(null);
          setDocThumbnail(null);
          qc.invalidateQueries({ queryKey: getListDocumentsQueryKey({}) });
          qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        },
        onError: (error) => {
          console.error('Error adding document:', error);
          toast({ title: "Error adding document", description: error.message, variant: "destructive" });
        },
      });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(0);

    try {
      let imageUrl = amazonForm.imageUrl;

      // Upload image if provided
      if (amazonImage) {
        setUploadProgress(50);
        imageUrl = await uploadFile(amazonImage, 'amazon-products');
      }

      setUploadProgress(90);

      createProduct.mutate({
        data: {
          title: amazonForm.title,
          description: amazonForm.description,
          affiliateUrl: amazonForm.affiliateUrl,
          imageUrl: imageUrl || null,
          price: amazonForm.price || null,
        }
      }, {
        onSuccess: () => {
          setUploadProgress(100);
          toast({ title: "Product added!" });
          setAmazonForm({ title: "", description: "", affiliateUrl: "", imageUrl: "", price: "" });
          setAmazonImage(null);
          qc.invalidateQueries({ queryKey: getListAmazonProductsQueryKey() });
        },
        onError: (error) => {
          toast({ title: "Error adding product", description: error.message, variant: "destructive" });
        },
      });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDeleteMockTest = (id: number) => {
    deleteMockTest.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Mock test deleted" });
        qc.invalidateQueries({ queryKey: getListMockTestsQueryKey() });
      },
    });
  };

  const handleAddMockTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (!jsonFile) {
        toast({ title: "Please select a JSON file", variant: "destructive" });
        setUploading(false);
        return;
      }

      const jsonText = await jsonFile.text();
      const jsonData = JSON.parse(jsonText);

      // Handle both simple array format and complex object format
      let questionsArray: any[];
      
      if (Array.isArray(jsonData)) {
        questionsArray = jsonData;
      } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
        questionsArray = jsonData.questions;
        // Auto-fill form from JSON if available
        if (jsonData.title && !mockTestForm.title) {
          setMockTestForm(prev => ({ ...prev, title: jsonData.title }));
        }
        if (jsonData.description && !mockTestForm.description) {
          setMockTestForm(prev => ({ ...prev, description: jsonData.description }));
        }
        if (jsonData.subject && !mockTestForm.subject) {
          setMockTestForm(prev => ({ ...prev, subject: jsonData.subject }));
        }
        if (jsonData.duration && mockTestForm.duration === "30") {
          setMockTestForm(prev => ({ ...prev, duration: String(jsonData.duration) }));
        }
      } else {
        toast({ title: "Invalid JSON format", description: "JSON must be an array of questions or contain a 'questions' array", variant: "destructive" });
        setUploading(false);
        return;
      }

      if (questionsArray.length === 0) {
        toast({ title: "Invalid JSON format", description: "No questions found in JSON", variant: "destructive" });
        setUploading(false);
        return;
      }

      const questions = questionsArray.map((q: any, index: number) => {
        // Handle both simple format (optionA, optionB, etc.) and complex format (options array)
        let optionA = "", optionB = "", optionC = "", optionD = "";
        
        if (q.options && Array.isArray(q.options)) {
          // Complex format with options array
          q.options.forEach((opt: any) => {
            const optId = opt.optionId || opt.id;
            const optText = opt.text || opt.content || "";
            if (optId === "A") optionA = optText;
            if (optId === "B") optionB = optText;
            if (optId === "C") optionC = optText;
            if (optId === "D") optionD = optText;
          });
        } else {
          // Simple format
          optionA = q.optionA || q.A || "";
          optionB = q.optionB || q.B || "";
          optionC = q.optionC || q.C || "";
          optionD = q.optionD || q.D || "";
        }

        return {
          question: q.question || q.questionText || `Question ${index + 1}`,
          questionImage: q.questionImage || q.image || null,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer: q.correctAnswer || q.answer || q.correct || "",
          solution: q.solution || q.explanation || null,
        };
      });

      createMockTest.mutate({
        data: {
          title: mockTestForm.title,
          description: mockTestForm.description,
          subject: mockTestForm.subject,
          duration: parseInt(mockTestForm.duration, 10),
          questions,
        }
      }, {
        onSuccess: () => {
          toast({ title: "Mock test added!" });
          setMockTestForm({ title: "", description: "", subject: "", duration: "30" });
          setJsonFile(null);
          qc.invalidateQueries({ queryKey: getListMockTestsQueryKey() });
        },
        onError: (error) => {
          toast({ title: "Error adding mock test", description: error.message, variant: "destructive" });
        },
      });
    } catch (error: any) {
      toast({ title: "Error parsing JSON", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setLocation("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="flex items-center gap-2 px-5 h-14 border-b border-sidebar-border shrink-0">
          <BookOpen className="h-5 w-5 text-sidebar-primary" />
          <span className="font-serif font-bold text-base">OkSchool Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === id ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
              data-testid={`sidebar-${id}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2 shrink-0">
          <Link href="/">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors rounded-lg">
              <Eye className="h-4 w-4" /> View Site
            </button>
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors rounded-lg" data-testid="button-signout">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6">

          {/* Overview */}
          {activeTab === "overview" && (
            <div>
              <h1 className="font-serif text-2xl font-bold mb-6">Dashboard</h1>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Views", value: stats?.totalViews ?? 0, icon: Eye },
                  { label: "PDF Downloads", value: stats?.pdfDownloads ?? 0, icon: Download },
                  { label: "Word Downloads", value: stats?.wordDownloads ?? 0, icon: Download },
                  { label: "Documents", value: stats?.totalDocuments ?? 0, icon: FileText },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-card border border-card-border rounded-xl p-5">
                    <Icon className="h-5 w-5 text-muted-foreground mb-2" />
                    <div className="text-3xl font-bold text-foreground">{value}</div>
                    <div className="text-sm text-muted-foreground mt-1">{label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
                <h2 className="font-serif text-lg font-semibold mb-4">Recent Documents</h2>
                {stats?.recentDocuments?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No documents yet.</p>
                ) : (
                  <div className="space-y-2">
                    {stats?.recentDocuments?.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium text-sm">{doc.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{doc.category.replace(/-/g, " ")} &bull; {doc.viewCount}v &bull; {doc.pdfDownloads} PDF</p>
                        </div>
                        <Badge className={doc.isFree ? "bg-green-100 text-green-700" : "bg-primary text-primary-foreground"}>
                          {doc.isFree ? "FREE" : `₹${doc.price}`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-card border border-card-border rounded-xl p-6">
                <h2 className="font-serif text-lg font-semibold mb-4">Site Sections</h2>
                <div className="flex flex-wrap gap-2">
                  {stats?.sectionCounts?.map(({ category, count }) => (
                    <span key={category} className="bg-muted text-foreground text-xs px-3 py-1.5 rounded-full font-medium">
                      {CATEGORY_LABELS[category] ?? category} &bull; {count} {category === "materials" ? "items" : "docs"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {activeTab === "documents" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-serif text-2xl font-bold">Documents</h1>
              </div>

              {/* Add document form */}
              <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2"><Plus className="h-4 w-4" /> Add Document</h2>
                <form onSubmit={handleAddDoc} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="doc-title">Title *</Label>
                    <Input id="doc-title" placeholder="Document name" value={docForm.title} onChange={(e) => setDocForm((f) => ({ ...f, title: e.target.value }))} className="mt-1" data-testid="input-doc-title" required />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="doc-desc">Description</Label>
                    <Input id="doc-desc" placeholder="Brief description" value={docForm.description} onChange={(e) => setDocForm((f) => ({ ...f, description: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="doc-cat">Category</Label>
                    <select id="doc-cat" value={docForm.category} onChange={(e) => setDocForm((f) => ({ ...f, category: e.target.value }))} className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm bg-background" data-testid="select-doc-category">
                      {Object.entries(CATEGORY_LABELS).filter(([k]) => k !== "materials").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="doc-type">File Type</Label>
                    <select id="doc-type" value={docForm.fileType} onChange={(e) => setDocForm((f) => ({ ...f, fileType: e.target.value }))} className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
                      <option value="pdf">PDF</option>
                      <option value="word">Word</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={docForm.isFree} onChange={(e) => setDocForm((f) => ({ ...f, isFree: e.target.checked }))} className="rounded" data-testid="checkbox-is-free" />
                      <span className="text-sm">Free</span>
                    </label>
                    {!docForm.isFree && (
                      <Input placeholder="Price (₹)" value={docForm.price} onChange={(e) => setDocForm((f) => ({ ...f, price: e.target.value }))} className="w-28" type="number" data-testid="input-doc-price" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="doc-file">Upload PDF File</Label>
                    <Input 
                      id="doc-file" 
                      type="file" 
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)} 
                      className="mt-1" 
                      accept=".pdf"
                    />
                  </div>
                  <div>
                    <Label htmlFor="doc-word-file">Upload Word File (Optional)</Label>
                    <Input 
                      id="doc-word-file" 
                      type="file" 
                      onChange={(e) => setDocWordFile(e.target.files?.[0] || null)} 
                      className="mt-1" 
                      accept=".doc,.docx"
                    />
                  </div>
                  <div>
                    <Label htmlFor="doc-thumb-file">Upload Thumbnail</Label>
                    <Input 
                      id="doc-thumb-file" 
                      type="file" 
                      onChange={(e) => setDocThumbnail(e.target.files?.[0] || null)} 
                      className="mt-1" 
                      accept="image/*"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button type="submit" disabled={createDoc.isPending || uploading} data-testid="button-add-doc">
                      {uploading ? "Uploading..." : createDoc.isPending ? "Adding..." : "Add Document"}
                    </Button>
                  </div>
                  {uploading && (
                    <div className="sm:col-span-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                </form>
              </div>

              {/* Documents table */}
              <div className="bg-card border border-card-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3">Title</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Type</th>
                      <th className="text-left px-4 py-3">Price</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(docs ?? []).map((doc) => (
                      <tr key={doc.id} className="hover:bg-muted/40 transition-colors" data-testid={`row-doc-${doc.id}`}>
                        <td className="px-4 py-3 font-medium text-foreground line-clamp-1">{doc.title}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell capitalize">{doc.category.replace(/-/g, " ")}</td>
                        <td className="px-4 py-3 text-muted-foreground uppercase hidden md:table-cell">{doc.fileType}</td>
                        <td className="px-4 py-3">
                          <Badge className={doc.isFree ? "bg-green-100 text-green-700 text-xs" : "bg-primary/10 text-primary text-xs"}>
                            {doc.isFree ? "FREE" : `₹${doc.price}`}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDeleteDoc(doc.id)} className="text-muted-foreground hover:text-destructive transition-colors" data-testid={`button-delete-doc-${doc.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(docs ?? []).length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No documents yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Materials */}
          {activeTab === "materials" && (
            <div>
              <h1 className="font-serif text-2xl font-bold mb-6">Amazon Products</h1>

              {/* Add product form */}
              <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2"><Plus className="h-4 w-4" /> Add Amazon Product</h2>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="az-title">Title *</Label>
                    <Input id="az-title" placeholder="Product name" value={amazonForm.title} onChange={(e) => setAmazonForm((f) => ({ ...f, title: e.target.value }))} className="mt-1" required data-testid="input-amazon-title" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="az-desc">Description</Label>
                    <Input id="az-desc" placeholder="Brief description" value={amazonForm.description} onChange={(e) => setAmazonForm((f) => ({ ...f, description: e.target.value }))} className="mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="az-url">Amazon Affiliate URL *</Label>
                    <Input id="az-url" placeholder="https://amazon.in/..." value={amazonForm.affiliateUrl} onChange={(e) => setAmazonForm((f) => ({ ...f, affiliateUrl: e.target.value }))} className="mt-1" required data-testid="input-amazon-url" />
                  </div>
                  <div>
                    <Label htmlFor="az-img-file">Upload Image</Label>
                    <Input 
                      id="az-img-file" 
                      type="file" 
                      onChange={(e) => setAmazonImage(e.target.files?.[0] || null)} 
                      className="mt-1" 
                      accept="image/*"
                    />
                  </div>
                  <div>
                    <Label htmlFor="az-price">Price</Label>
                    <Input id="az-price" placeholder="₹499" value={amazonForm.price} onChange={(e) => setAmazonForm((f) => ({ ...f, price: e.target.value }))} className="mt-1" data-testid="input-amazon-price" />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button type="submit" disabled={createProduct.isPending || uploading} data-testid="button-add-product">
                      {uploading ? "Uploading..." : createProduct.isPending ? "Adding..." : "Add Product"}
                    </Button>
                  </div>
                  {uploading && (
                    <div className="sm:col-span-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                </form>
              </div>

              {/* Products table */}
              <div className="bg-card border border-card-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3">Title</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Price</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(products ?? []).map((p) => (
                      <tr key={p.id} className="hover:bg-muted/40 transition-colors" data-testid={`row-amazon-${p.id}`}>
                        <td className="px-4 py-3 font-medium text-foreground">{p.title}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.price ?? "—"}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDeleteProduct(p.id)} className="text-muted-foreground hover:text-destructive transition-colors" data-testid={`button-delete-amazon-${p.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(products ?? []).length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No products yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mock Tests */}
          {activeTab === "mock-tests" && (
            <div>
              <h1 className="font-serif text-2xl font-bold mb-6">Mock Tests</h1>

              {/* Add mock test form */}
              <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2"><Plus className="h-4 w-4" /> Add Mock Test</h2>
                <form onSubmit={handleAddMockTest} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="mt-title">Title *</Label>
                    <Input id="mt-title" placeholder="Test name" value={mockTestForm.title} onChange={(e) => setMockTestForm((f) => ({ ...f, title: e.target.value }))} className="mt-1" required />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="mt-desc">Description</Label>
                    <Input id="mt-desc" placeholder="Brief description" value={mockTestForm.description} onChange={(e) => setMockTestForm((f) => ({ ...f, description: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="mt-subject">Subject *</Label>
                    <Input id="mt-subject" placeholder="Physics, Chemistry, etc." value={mockTestForm.subject} onChange={(e) => setMockTestForm((f) => ({ ...f, subject: e.target.value }))} className="mt-1" required />
                  </div>
                  <div>
                    <Label htmlFor="mt-duration">Duration (minutes) *</Label>
                    <Input id="mt-duration" type="number" placeholder="30" value={mockTestForm.duration} onChange={(e) => setMockTestForm((f) => ({ ...f, duration: e.target.value }))} className="mt-1" required />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="mt-json">Questions JSON File *</Label>
                    <Input 
                      id="mt-json" 
                      type="file" 
                      onChange={(e) => setJsonFile(e.target.files?.[0] || null)} 
                      className="mt-1" 
                      accept=".json"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a JSON file with questions. Format: array of objects with question, options, correctAnswer, and solution fields
                    </p>
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button type="submit" disabled={createMockTest.isPending || uploading}>
                      {uploading ? "Creating..." : createMockTest.isPending ? "Adding..." : "Add Mock Test"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Mock tests table */}
              <div className="bg-card border border-card-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3">Title</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Subject</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Duration</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Questions</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(mockTests ?? []).map((test) => (
                      <tr key={test.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{test.title}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{test.subject}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{test.duration} min</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{test.questionCount}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDeleteMockTest(test.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(mockTests ?? []).length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No mock tests yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "traffic" && (
            <div>
              <h1 className="font-serif text-2xl font-bold mb-4">Traffic</h1>
              <p className="text-muted-foreground">Analytics integration (e.g. Google Analytics or Plausible) can be configured via environment variables.</p>
            </div>
          )}
          {activeTab === "searches" && (
            <div>
              <h1 className="font-serif text-2xl font-bold mb-4">Searches</h1>
              <p className="text-muted-foreground">Search query analytics coming soon.</p>
            </div>
          )}
          {activeTab === "settings" && (
            <div>
              <h1 className="font-serif text-2xl font-bold mb-4">Settings</h1>
              <div className="bg-card border border-card-border rounded-xl p-6 max-w-lg">
                <p className="text-sm text-muted-foreground mb-4">Configure environment variables in <code className="bg-muted px-1 rounded text-xs">.env</code> to enable external services.</p>
                <div className="space-y-2 text-sm text-muted-foreground font-mono">
                  <div>RAZORPAY_KEY_ID=...</div>
                  <div>RAZORPAY_KEY_SECRET=...</div>
                  <div>VITE_SUPABASE_URL=...</div>
                  <div>VITE_SUPABASE_ANON_KEY=...</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
