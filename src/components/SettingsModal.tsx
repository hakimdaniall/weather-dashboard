import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Clock4 } from "lucide-react";

interface SettingsModalProps {
  staleTime: number | undefined;
  onStaleTimeChange: (value: number | undefined) => void;
}

const SettingsModal = ({ staleTime, onStaleTimeChange }: SettingsModalProps) => {
  const [open, setOpen] = useState(false);

  const handleValueChange = (value: string) => {
    if (value === "none") {
      onStaleTimeChange(undefined);
    } else {
      onStaleTimeChange(Number(value));
    }
    setOpen(false); // ✅ close dialog after selection
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="absolute top-0 right-0 m-4 bg-white/90 backdrop-blur-sm hover:bg-white shadow-md cursor-pointer"
        >
          <Clock4 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md w-[300px]">
        <DialogHeader>
          <DialogTitle>Query Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Set staleTime:</label>
            <Select
              value={staleTime ? staleTime.toString() : "none"}
              onValueChange={handleValueChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="None (default)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (default)</SelectItem>
                <SelectItem value={(1000 * 60).toString()}>1 minute</SelectItem>
                <SelectItem value={(1000 * 60 * 5).toString()}>5 minutes</SelectItem>
                <SelectItem value={(1000 * 60 * 10).toString()}>10 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;