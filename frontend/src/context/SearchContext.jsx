import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const location = useLocation();
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get("search") || "");

  useEffect(() => {
    setSearch(new URLSearchParams(location.search).get("search") || "");
  }, [location.search]);

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
