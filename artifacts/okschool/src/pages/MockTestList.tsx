import { Clock, FileText, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useListMockTests } from "@workspace/api-client-react";

export function MockTestList() {
  const { data: tests, isLoading } = useListMockTests({
    query: { queryKey: ["mock-tests"] },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-2">Mock Tests</h1>
        <p className="text-muted-foreground">Practice with our comprehensive mock tests designed to simulate real exam conditions.</p>
      </div>

      {tests && tests.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {tests.map((test) => (
            <div key={test.id} className="bg-card border border-card-border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="font-serif text-xl font-semibold mb-2">{test.title}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{test.description}</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {test.subject}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  <span>{test.questionCount} Questions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{test.duration} min</span>
                </div>
              </div>

              <Link href={`/mock-test/${test.id}`}>
                <Button className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Start Test
                </Button>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-xl p-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="font-serif text-xl font-semibold mb-2">No Mock Tests Available</h2>
          <p className="text-muted-foreground">Check back later for new practice tests.</p>
        </div>
      )}
    </div>
  );
}
