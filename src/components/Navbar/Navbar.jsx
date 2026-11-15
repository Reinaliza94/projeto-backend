import { NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
    return (
        <nav className="navbar">

            <NavLink to="/" end>
                Home
            </NavLink>

            <NavLink to="/produtos">
                Produtos
            </NavLink>

            <NavLink to="/categorias">
                Categorias
            </NavLink>

            <NavLink to="/meus-pedidos">
                Meus Pedidos
            </NavLink>

        </nav>
    );
}

export default Navbar;