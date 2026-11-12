"use client";

import { SimpleContentClient } from "@/components/simple-content-client";

type WorkspaceProps = {
  emptyHint: string;
};

export function SimpleContentWorkspace({ emptyHint }: WorkspaceProps) {
  return <SimpleContentClient emptyHint={emptyHint} />;
}

export function SimpleContentWorkspaceBlogg() {
  return (
    <SimpleContentWorkspace emptyHint="Välj en bloggartikel i sidofältet." />
  );
}

export function SimpleContentWorkspaceLegal() {
  return (
    <SimpleContentWorkspace emptyHint="Välj en juridisk sida i sidofältet." />
  );
}
