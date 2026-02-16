import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Velkommen til FamilyMind
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl">
          Din strukturerede forældreguide — evidensbaseret viden og
          praktiske værktøjer til hele familien.
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard">Kom i gang</Link>
        </Button>
      </main>
    </div>
  );
}
