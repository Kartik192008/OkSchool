import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Download, Lock, ArrowLeft, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  useGetDocument,
  getGetDocumentQueryKey,
  useRecordDocumentView,
  useRecordDocumentDownload,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function StudyMaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const docId = parseInt(id ?? "0", 10);
  const { toast } = useToast();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paid, setPaid] = useState(false);

  const { data: doc, isLoading } = useGetDocument(docId, {
    query: { enabled: !!docId, queryKey: getGetDocumentQueryKey(docId) },
  });

  const recordView = useRecordDocumentView();
  const recordDownload = useRecordDocumentDownload();

  useEffect(() => {
    if (docId) recordView.mutate({ id: docId });
  }, [docId]);

  const handleDownload = (fileType: "pdf" | "word") => {
    recordDownload.mutate({ id: docId, data: { fileType } });
    toast({ title: `${fileType.toUpperCase()} download started`, description: doc?.title });
  };

  const handlePayment = () => {
    setTimeout(() => {
      setPaid(true);
      setPaymentOpen(false);
      toast({ title: "Payment successful!", description: "Your Word file is now unlocked." });
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-bold">Document not found</h2>
        <Link href="/"><Button variant="outline" className="mt-4">Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/" data-testid="link-back">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </Link>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Preview pane */}
        <div className="md:col-span-2">
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="bg-muted/50 border-b px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="truncate">{doc.title}</span>
            </div>
            <div className="h-[480px] overflow-y-auto p-6 space-y-3" data-testid="document-preview">
              {doc.thumbnailUrl ? (
                <img src={doc.thumbnailUrl} alt={doc.title} className="w-full rounded-lg mb-4" />
              ) : (
                <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-16 w-16 text-muted-foreground/40" />
                </div>
              )}
              <h2 className="font-serif text-2xl font-bold text-foreground">{doc.title}</h2>
              <p className="text-muted-foreground">{doc.description}</p>
              <hr className="border-border" />
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className={`space-y-2 ${i > 5 && !doc.isFree && !paid ? "blur-sm select-none pointer-events-none" : ""}`}>
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                  <div className="h-3 bg-muted rounded w-4/5" />
                  {i % 4 === 3 && <div className="h-20 bg-muted/60 rounded-lg my-4" />}
                </div>
              ))}
              {!doc.isFree && !paid && (
                <div className="sticky bottom-0 py-4 bg-gradient-to-t from-card via-card text-center">
                  <p className="text-sm font-medium text-muted-foreground">Get the full editable Word file for ₹{doc.price ?? 20}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h1 className="font-serif text-lg font-bold text-foreground leading-snug">{doc.title}</h1>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="capitalize text-xs">{doc.category.replace(/-/g, " ")}</Badge>
              <Badge className={doc.isFree ? "bg-green-100 text-green-700 border-green-200" : "bg-primary text-primary-foreground"}>
                {doc.isFree ? "FREE PDF" : `PAID — ₹${doc.price ?? 20}`}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5">
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{doc.viewCount} views</span>
              <span className="flex items-center gap-1"><Download className="h-3 w-3" />{doc.pdfDownloads} downloads</span>
            </div>

            {doc.isFree || paid ? (
              <Button
                className="w-full"
                onClick={() => handleDownload("pdf")}
                data-testid="button-download-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF — Free
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Lock className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
                  <p className="text-sm font-medium">Editable Word file locked</p>
                  <p className="text-xs text-muted-foreground">Pay ₹{doc.price ?? 20} to download</p>
                </div>
                <Button className="w-full" onClick={() => setPaymentOpen(true)} data-testid="button-pay">
                  Pay ₹{doc.price ?? 20} — Get Word File
                </Button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-card border border-card-border rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>File Type</span><span className="font-medium text-foreground uppercase">{doc.fileType}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Category</span><span className="font-medium text-foreground capitalize">{doc.category.replace(/-/g, " ")}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>PDF Downloads</span><span className="font-medium text-foreground">{doc.pdfDownloads}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Word Downloads</span><span className="font-medium text-foreground">{doc.wordDownloads}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay simulated checkout modal */}
      {paymentOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPaymentOpen(false)}>
          <div className="bg-card border border-card-border rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()} data-testid="payment-modal">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
                Secure Payment
              </div>
              <h3 className="font-serif text-xl font-bold">Complete Payment</h3>
              <p className="text-muted-foreground text-sm mt-1">{doc.title}</p>
            </div>

            {/* Fake UPI QR */}
            <div className="border-2 border-dashed border-border rounded-xl p-4 mb-4 flex flex-col items-center">
              <div className="w-40 h-40 relative mb-2">
                <div className="absolute inset-0 grid grid-cols-10 gap-0.5 p-1">
                  {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} className={`rounded-[1px] ${Math.random() > 0.5 ? "bg-foreground" : "bg-background"}`} />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background p-1.5 rounded">
                    <BookOpenIcon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Scan QR with any UPI app</p>
              <p className="font-bold text-foreground mt-1">₹{doc.price ?? 20}</p>
            </div>

            <div className="text-center text-xs text-muted-foreground mb-4">
              UPI ID: okschool@upi &bull; Merchant: OkSchool
            </div>

            <Button className="w-full" onClick={handlePayment} data-testid="button-complete-payment">
              I have completed the payment
            </Button>
            <button
              onClick={() => setPaymentOpen(false)}
              className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
