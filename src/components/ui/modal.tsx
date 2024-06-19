import * as React from "react";

import { useMediaQuery } from "usehooks-ts";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
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
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modalTitle: React.ReactNode;
  modalTitleDescription?: React.ReactNode;
  modalContent: React.ReactNode;
};

export function Modal({
  trigger,
  open,
  setOpen,
  modalTitle,
  modalTitleDescription,
  modalContent,
}: ModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            {modalTitleDescription && (
              <DialogDescription>{modalTitleDescription}</DialogDescription>
            )}
          </DialogHeader>
          {modalContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle>{modalTitle}</DrawerTitle>
          {modalTitleDescription && (
            <DrawerDescription>{modalTitleDescription}</DrawerDescription>
          )}
        </DrawerHeader>
        {modalContent}
        <DrawerFooter className="pt-2"></DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
