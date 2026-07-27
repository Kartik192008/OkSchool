import { BookOpen } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-card border-t py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-serif font-bold text-xl tracking-tight text-foreground">OkSchool</span>
            </Link>
            <p className="text-muted-foreground max-w-sm">
              Your trustworthy study-material hub. Find the best notes, practicals, and mock tests organized perfectly for Indian students.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Study Material</Link></li>
              <li><Link href="/mock-tests" className="hover:text-primary transition-colors">Mock Tests</Link></li>
              <li><Link href="/amazon-store" className="hover:text-primary transition-colors">Amazon Store</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Admin Login</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground flex flex-col sm:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} OkSchool. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Made with ❤️ for Indian Students.</p>
        </div>
      </div>
    </footer>
  );
}
