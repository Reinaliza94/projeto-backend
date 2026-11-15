import { createContext, useState } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [orders, setOrders] = useState([]);
    
    function addToCart(product, selectedColor, selectedSize) {
        const cartItemId = `${product.id}-${selectedColor}-${selectedSize}`;
        const productVariant = {
            ...product,
            cartItemId,
            selectedColor,
            selectedSize
        };

        setCart((currentCart) => {
            const existingProduct = currentCart.find(
                (item) => item.cartItemId === cartItemId
            );

            if (existingProduct) {
                return currentCart.map((item) =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [...currentCart, { ...productVariant, quantity: 1 }];
        });
    }

    function updateQuantity(cartItemId, newQuantity) {
        if (newQuantity <= 0) {
            removeFromCart(cartItemId);
            return;
        }

        setCart((currentCart) =>
            currentCart.map((item) =>
                item.cartItemId === cartItemId
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
    }

    function removeFromCart(cartItemId) {
        setCart((currentCart) =>
            currentCart.filter((item) => item.cartItemId !== cartItemId)
        );
    }

    function placeOrder() {
        if (cart.length === 0) {
            return null;
        }

        const order = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            items: cart.map((item) => ({ ...item })),
            total: cart.reduce(
                (sum, item) => sum + item.priceDiscount * item.quantity,
                0
            )
        };

        setOrders((currentOrders) => [order, ...currentOrders]);
        setCart([]);
        return order;
    }

    return (
        <CartContext.Provider
            value={{
                cart,
                orders,
                addToCart,
                updateQuantity,
                removeFromCart,
                placeOrder
            }}
        >
            {children}
        </CartContext.Provider>
    );
}