import { Navigate, Route, Routes } from "react-router-dom";

import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import Navbar from "./components/Navbar/Navbar";

import HomePage from "./pages/HomePage";
import ProductListingPage from "./pages/ProductListingPage";
import ProductViewPage from "./pages/ProductViewPage";
import CategoriesPage from "./pages/CategoriesPage";
import OrdersPage from "./pages/OrdersPage";
import CartPage from "./pages/CartPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage, { PasswordRecoveryPage } from "./pages/LoginPage";

import "./App.css";

function App() {
    return (
        <div className="App">

            <Header />

            <Navbar />

            <main className="main-content">

                <Routes>
                    <Route path="/" element={<HomePage />} />

                    <Route
                        path="/produtos"
                        element={<ProductListingPage />}
                    />

                    <Route 
                        path="/carrinho" 
                        element={<CartPage />} 
                    />

                    <Route
                        path="/produto/:id"
                        element={<ProductViewPage />}
                    />

                    <Route
                        path="/produtos/:id"
                        element={<ProductViewPage />}
                    />

                    <Route
                        path="/categorias"
                        element={<CategoriesPage />}
                    />

                    <Route
                        path="/meus-pedidos"
                        element={<OrdersPage />}
                    />

                    <Route
                        path="/cadastro"
                        element={<RegisterPage />}
                    />

                    <Route
                        path="/login"
                        element={<LoginPage />}
                    />

                    <Route
                        path="/recuperar-senha"
                        element={<PasswordRecoveryPage />}
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                    
                </Routes>

            </main>

            <Footer />

        </div>
    );
}

export default App;