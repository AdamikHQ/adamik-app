import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Smartphone, Loader2 } from "lucide-react";

interface IoFinnetApprovalModalProps {
  open: boolean;
  chainId?: string;
}

export const IoFinnetApprovalModal: React.FC<IoFinnetApprovalModalProps> = ({
  open,
  chainId,
}) => {
  return (
    <Dialog open={open} modal={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src="/assets/iofinnet1.svg" alt="IoFinnet" className="h-6 w-6" />
            IoFinnet Approval Required
          </DialogTitle>
          <DialogDescription>
            Check your IoFinnet mobile app to approve the transaction
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="relative">
            <Smartphone className="h-16 w-16 text-blue-500 animate-pulse" />
            <Loader2 className="absolute -bottom-1 -right-1 h-6 w-6 animate-spin text-blue-600" />
          </div>
          
          <div className="text-center space-y-2">
            <p className="font-medium">
              Approve on your mobile device
            </p>
            <p className="text-sm text-muted-foreground">
              The transaction is waiting for your approval
            </p>
            {chainId && (
              <p className="text-xs text-muted-foreground">
                Chain: {chainId}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Waiting for approval (up to 10 minutes)</span>
          </div>

          <div className="w-full mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-xs text-center text-blue-700 dark:text-blue-400">
              Do not close this window while approving
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};