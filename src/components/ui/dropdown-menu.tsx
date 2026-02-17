"use client";

import { useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";

export function DropdownMenu({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setOpen((v) => !v)} type="button">
        {label}
      </button>
      {open && <div className="absolute right-0 mt-2 min-w-40 rounded-md border bg-white p-1 shadow">{children}</div>}
    </div>
  );
}

export function DropdownMenuItem({ className, ...props }: HTMLAttributes<HTMLButtonElement>) {
  return <button className={"block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100 " + (className ?? "")} {...props} />;
}