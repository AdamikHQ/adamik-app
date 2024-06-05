import { BookText, Github, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export const AdamikLink = () => {
  return (
    <div className="mt-auto p-0 md:p-4">
      <div className="flex justify-center gap-4 mb-4">
        <Link href="https://adamik.io" target="_blank">
          <Home />
        </Link>
        <Link href="https://github.com/AdamikHQ" target="_blank">
          <Github />
        </Link>
        <Link href="https://docs.adamik.io" target="_blank">
          <BookText />
        </Link>
      </div>
      <Card className="p-4">
        <CardHeader className="p-0 w-max-[130px]">
          <CardTitle>Get an API Key</CardTitle>
          <CardDescription>
            Get started with Adamik API for free
          </CardDescription>
        </CardHeader>
        <CardContent className="py-0 pt-4">
          <Button size="sm" className="w-full" asChild>
            <Link href="https://dashboard.adamik.io/" target="_blank">
              Connect
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
