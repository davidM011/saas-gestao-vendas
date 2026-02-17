"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function Dialog({
  trigger,
  title,
  children,
}: {
  trigger: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-lg font-semibold">{title}</h3>
            <div>{children}</div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setOpen(false)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}