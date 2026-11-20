import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useAuth } from "../context/useAuth";
import "./CartPage.css";

function CartPage() {
    const { cart, updateQuantity, removeFromCart, placeOrder } =
        useContext(CartContext);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [checkoutError, setCheckoutError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const total = cart.reduce(
        (sum, item) => sum + item.priceDiscount * item.quantity,
        0
    );

    const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
    );

    function formatPrice(value) {
        return value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    async function handleCheckout() {
        if (!isAuthenticated) {
            navigate("/login", { state: { from: "/carrinho" } });
            return;
        }

        setCheckoutError("");
        setSubmitting(true);
        try {
            const order = await placeOrder();
            if (order) {
                navigate("/meus-pedidos");
            }
        } catch (requestError) {
            setCheckoutError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="cart-page">
            <h2>Meu Carrinho</h2>

            {cart.length === 0 ? (
                <div className="empty-cart">
                    <i className="pi pi-shopping-cart"></i>
                    <h3>Seu carrinho está vazio!</h3>
                    <p>Adicione produtos para continuar sua compra.</p>

                    <Link to="/produtos" className="continue-shopping">
                        Ver produtos
                    </Link>
                </div>
            ) : (
                <div className="cart-content">
                    <div className="cart-items">
                        {cart.map((item) => (
                            <div className="cart-item" key={item.cartItemId}>
                                <img
                                    src={item.image}
                                    alt={item.name}
                                />

                                <div className="cart-item-info">
                                    <h3>{item.name}</h3>
                                    <p>{item.category}</p>
                                    <p>
                                        Cor: {item.selectedColor} · Tamanho: {item.selectedSize}
                                    </p>

                                    <strong>
                                        {formatPrice(item.priceDiscount)}
                                    </strong>

                                    <div className="quantity-control">
                                        <button
                                            onClick={() =>
                                                updateQuantity(
                                                    item.cartItemId,
                                                    item.quantity - 1
                                                )
                                            }
                                        >
                                            -
                                        </button>

                                        <span>{item.quantity}</span>

                                        <button
                                            onClick={() =>
                                                updateQuantity(
                                                    item.cartItemId,
                                                    item.quantity + 1
                                                )
                                            }
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        className="remove-item"
                                        onClick={() => removeFromCart(item.cartItemId)}
                                    >
                                        Remover
                                    </button>
                                </div>

                                <div className="cart-item-subtotal">
                                    {formatPrice(
                                        item.priceDiscount * item.quantity
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <aside className="cart-summary">
                        <h3>Resumo da compra</h3>
                        {checkoutError && (
                            <p role="alert">{checkoutError}</p>
                        )}
                        <p>
                            Quantidade de produtos: {totalItems}
                        </p>

                        <div className="cart-total">
                            <span>Total:</span>
                            <strong>{formatPrice(total)}</strong>
                        </div>

                        <button
                            className="checkout-button"
                            type="button"
                            onClick={handleCheckout}
                            disabled={submitting}
                        >
                            {submitting ? "Finalizando..." : "Finalizar compra"}
                        </button>

                        <Link to="/produtos">
                            Continuar comprando
                        </Link>
                    </aside>
                </div>
            )}
        </section>
    );
}

export default CartPage;
