import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext";
import { CatalogProvider } from "./context/CatalogContext";
import { AuthProvider } from "./context/AuthContext";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./index.css";

createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <CatalogProvider>
                    <CartProvider>
                        <App />
                    </CartProvider>
                </CatalogProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);