import { useContext } from "react";
import CatalogContext from "./catalog-context";

export function useCatalog() {
    const context = useContext(CatalogContext);
    if (!context) {
        throw new Error("useCatalog deve ser usado dentro de CatalogProvider.");
    }
    return context;
}
