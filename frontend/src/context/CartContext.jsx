import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";
import { createOrder, getOrders } from "../api/client";
import AuthContext from "./auth-context";

export const CartContext = createContext();

const CART_STORAGE_KEY = "drip-store-cart";

function readStoredCart() {
    try {
        const storedValue = window.localStorage.getItem(CART_STORAGE_KEY);
        if (!storedValue) {
            return [];
        }

        const parsedValue = JSON.parse(storedValue);
        return Array.isArray(parsedValue) ? parsedValue : [];
    } catch {
        return [];
    }
}

export function CartProvider({ children }) {
    const [cart, setCart] = useState(readStoredCart);
    const [orderState, setOrderState] = useState({
        token: null,
        orders: [],
        error: ""
    });
    const ordersRequestGeneration = useRef(0);
    const auth = useContext(AuthContext);
    const currentOrderState =
        orderState.token === auth?.token ? orderState : null;
    const orders = currentOrderState?.orders ?? [];
    const ordersLoading = Boolean(auth?.token) && currentOrderState === null;
    const ordersError = currentOrderState?.error ?? "";

    useEffect(() => {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        if (!auth?.token) {
            return undefined;
        }

        const requestGeneration = ++ordersRequestGeneration.current;

        getOrders(auth.token)
            .then((loadedOrders) => {
                if (requestGeneration === ordersRequestGeneration.current) {
                    setOrderState({
                        token: auth.token,
                        orders: loadedOrders,
                        error: ""
                    });
                }
            })
            .catch((requestError) => {
                if (requestGeneration === ordersRequestGeneration.current) {
                    setOrderState({
                        token: auth.token,
                        orders: [],
                        error: requestError.message
                    });
                }
            });

        return () => {
            if (requestGeneration === ordersRequestGeneration.current) {
                ordersRequestGeneration.current += 1;
            }
        };
    }, [auth?.token]);
    
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

    async function placeOrder() {
        if (!auth?.isAuthenticated || !auth.token) {
            return null;
        }

        if (cart.length === 0) {
            return null;
        }

        const order = await createOrder(
            cart.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
                selectedColor: item.selectedColor,
                selectedSize: item.selectedSize
            })),
            auth.token
        );
        ordersRequestGeneration.current += 1;
        setOrderState((currentState) => ({
            token: auth.token,
            orders: [
                order,
                ...(currentState.token === auth.token ? currentState.orders : [])
            ],
            error: ""
        }));
        setCart([]);
        return order;
    }

    return (
        <CartContext.Provider
            value={{
                cart,
                orders,
                ordersLoading,
                ordersError,
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