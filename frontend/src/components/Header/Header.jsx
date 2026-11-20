
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../../assets/logo-header.svg";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

import { CartContext } from "../../context/CartContext";
import { useAuth } from "../../context/useAuth";

import "./Header.css";

function Header() {
    const { cart } = useContext(CartContext);
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    const totalItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    function handleSearch(event) {
        event.preventDefault();
        const query = searchTerm.trim();

        navigate({
            pathname: "/produtos",
            search: query ? `?q=${encodeURIComponent(query)}` : ""
        });
    }

    return (
        <header className="header">
            <Link to="/" className="logo" aria-label="Ir para a página inicial">
                <img src={logo} alt="Drip Store" />
            </Link>

            <form className="search" onSubmit={handleSearch} role="search">
                <InputText
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Pesquisar produto"
                    aria-label="Pesquisar produtos"
                />
                <Button
                    type="submit"
                    icon="pi pi-search"
                    aria-label="Buscar produtos"
                />
            </form>

            <div className="user-actions">
                {isAuthenticated ? (
                    <Button type="button" onClick={logout}>
                        Sair
                    </Button>
                ) : (
                    <>
                        <Button type="button" onClick={() => navigate("/cadastro")}>
                            Cadastre-se
                        </Button>

                        <Button
                            type="button"
                            onClick={() => navigate("/login")}
                            style={{ backgroundColor: "#C92071", color: "#fff" }}
                        >
                            Entrar
                        </Button>
                    </>
                )}

                <Link to="/carrinho" className="cart-link">
                    <Button
                        icon="pi pi-shopping-cart"
                        aria-label="Carrinho"
                        text
                    />

                    {totalItems > 0 && (
                        <span className="cart-count">
                            {totalItems}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
}

export default Header;
