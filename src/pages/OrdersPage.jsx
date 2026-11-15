import { useContext } from "react";
import { Link } from "react-router-dom";

import { CartContext } from "../context/CartContext";
import "./OrdersPage.css";

function formatPrice(value) {
    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function OrdersPage() {
    const { orders } = useContext(CartContext);

    return (
        <section className="orders-page">
            <header className="orders-header">
                <h2>Meus Pedidos</h2>
                <p>Acompanhe suas compras realizadas na Drip Store.</p>
            </header>

            {orders.length === 0 ? (
                <div className="orders-empty">
                    <i className="pi pi-shopping-bag" aria-hidden="true"></i>
                    <h3>Você ainda não possui pedidos.</h3>
                    <p>
                        Quando realizar uma compra, seus pedidos aparecerão aqui.
                    </p>
                    <Link to="/produtos" className="orders-shop-link">
                        Ver produtos
                    </Link>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map((order) => {
                        const itemCount = order.items.reduce(
                            (total, item) => total + item.quantity,
                            0
                        );

                        return (
                            <article className="order-card" key={order.id}>
                                <header className="order-card-header">
                                    <div>
                                        <h3>Pedido #{order.id}</h3>
                                        <time dateTime={order.createdAt}>
                                            {new Date(order.createdAt).toLocaleString("pt-BR")}
                                        </time>
                                    </div>
                                    <span className="order-status">
                                        Pedido realizado
                                    </span>
                                </header>

                                <div className="order-items">
                                    {order.items.map((item) => (
                                        <div
                                            className="order-item"
                                            key={item.cartItemId}
                                        >
                                            <img src={item.image} alt={item.name} />

                                            <div className="order-item-info">
                                                <h4>{item.name}</h4>
                                                <p>
                                                    Cor: {item.selectedColor} · Tamanho: {item.selectedSize}
                                                </p>
                                                <p>Quantidade: {item.quantity}</p>
                                            </div>

                                            <strong className="order-item-subtotal">
                                                {formatPrice(
                                                    item.priceDiscount * item.quantity
                                                )}
                                            </strong>
                                        </div>
                                    ))}
                                </div>

                                <footer className="order-card-footer">
                                    <span>
                                        {itemCount} {itemCount === 1 ? "item" : "itens"}
                                    </span>
                                    <p>
                                        Total do pedido: <strong>{formatPrice(order.total)}</strong>
                                    </p>
                                </footer>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default OrdersPage;
