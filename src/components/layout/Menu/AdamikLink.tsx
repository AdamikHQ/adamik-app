import { BookText, Github, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "~/components/ui/card";

export const AdamikLink = () => {
  return (
    <div className="fixed bottom-0 left-0 p-4">
      <div className="flex justify-center gap-4 mb-4">
        <Link href="https://adamik.io" target="_blank" aria-label="Adamik Home">
          <Home />
        </Link>
        <Link
          href="https://github.com/AdamikHQ"
          target="_blank"
          aria-label="Adamik GitHub"
        >
          <Github />
        </Link>
        <Link
          href="https://docs.adamik.io"
          target="_blank"
          aria-label="Adamik Documentation"
        >
          <BookText />
        </Link>
      </div>
      <Card className="p-4">
        <CardHeader className="p-0 flex justify-center">
          <CardDescription className="whitespace-nowrap text-center">
            Explore the Adamik API for free
          </CardDescription>
        </CardHeader>
        <CardContent className="py-0 pt-4">
          <Button size="sm" className="w-full" asChild>
            <Link href="https://dashboard.adamik.io/" target="_blank">
              Get your API Key
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
