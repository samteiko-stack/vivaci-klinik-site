"use client";

import { createContext, useContext } from "react";

/** True when child content renders inside `SettingsSection list`. */
const SettingsSectionListContext = createContext(false);

export function SettingsSectionListProvider({
  value,
  children,
}: {
  value: boolean;
  children: React.ReactNode;
}) {
  return (
    <SettingsSectionListContext.Provider value={value}>{children}</SettingsSectionListContext.Provider>
  );
}

export function useSettingsSectionList(): boolean {
  return useContext(SettingsSectionListContext);
}
