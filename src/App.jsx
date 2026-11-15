import { Routes, Route } from "react-router-dom";

import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import Navbar from "./components/Navbar/Navbar";

import HomePage from "./pages/HomePage";
import ProductListingPage from "./pages/ProductListingPage";
import ProductViewPage from "./pages/ProductViewPage";
import CategoriesPage from "./pages/CategoriesPage";
import OrdersPage from "./pages/OrdersPage";
import CartPage from "./pages/CartPage";

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
                        path="/categorias"
                        element={<CategoriesPage />}
                    />

                    <Route
                        path="/meus-pedidos"
                        element={<OrdersPage />}
                    />
                    
                </Routes>

            </main>

            <Footer />

        </div>
    );
}

export default App;