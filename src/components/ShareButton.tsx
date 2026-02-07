import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

type ShareButtonProps = {
  substances: string[];
};

export function ShareButton({ substances }: ShareButtonProps) {
  const handleShare = async () => {
    if (substances.length === 0) return;

    const url =
      window.location.origin +
      window.location.pathname +
      "?substances=" +
      encodeURIComponent(substances.join(","));

    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      toast.error("Failed to copy URL");
    }
  };

  return (
    <Button variant="outline" onClick={handleShare} disabled={substances.length === 0}>
      <Share2 className="mr-2 h-4 w-4" />
      Share
    </Button>
  );
}
