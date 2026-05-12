import { createContext, useContext, useMemo, useState } from "react";

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [search, setSearch] = useState("");

  const value = useMemo(() => ({ search, setSearch }), [search]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useModuleSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useModuleSearch deve ser usado dentro de SearchProvider");
  }
  return context;
}
