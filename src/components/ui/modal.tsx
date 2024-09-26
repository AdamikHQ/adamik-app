import { X } from "lucide-react";
import * as React from "react";
import { useMediaQuery } from "usehooks-ts";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";

type ModalProps = {
  trigger?: React.ReactNode;
  open: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  modalTitle?: React.ReactNode;
  modalTitleDescription?: React.ReactNode;
  modalContent: React.ReactNode;
  displayCloseButton?: boolean;
};

export function Modal({
  trigger,
  open,
  setOpen,
  modalTitle,
  modalTitleDescription,
  modalContent,
  displayCloseButton = true,
}: ModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="sm:max-w-[425px] lg:max-w-[660px]">
          <DialogHeader>
            {modalTitle && <DialogTitle>{modalTitle}</DialogTitle>}
            {modalTitleDescription && (
              <DialogDescription>{modalTitleDescription}</DialogDescription>
            )}
          </DialogHeader>
          <div role="document">{modalContent}</div>
          {displayCloseButton && (
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader className="text-center">
          {modalTitle && <DrawerTitle>{modalTitle}</DrawerTitle>}
          {modalTitleDescription && (
            <DrawerDescription>{modalTitleDescription}</DrawerDescription>
          )}
        </DrawerHeader>
        <div role="document">{modalContent}</div>
        <DrawerFooter className="pt-2"></DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
