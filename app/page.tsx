import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <Building2 className="h-16 w-16 text-primary" />
      <h1 className="text-4xl font-bold">Welcome to VC Intelligence</h1>
      <p className="text-muted-foreground text-lg max-w-md text-center">
        Discover, track, and analyze startup companies with our premium intelligence platform.
      </p>
      <Link href="/companies">
        <Button size="lg">Explore Companies</Button>
      </Link>
    </div>
  );
}
