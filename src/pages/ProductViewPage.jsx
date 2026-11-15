import { useParams, Link } from "react-router-dom";
import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import products from "../data/products";
import "./ProductViewPage.css";

function ProductViewPage() {
    const { id } = useParams();
    const { addToCart } = useContext(CartContext);
    const product = products.find(
        (item) => item.id === Number(id)
    );
    const [selection, setSelection] = useState({
        productId: product?.id,
        color: "",
        size: null
    });
    const selectedColor = selection.productId === product?.id ? selection.color : "";
    const selectedSize = selection.productId === product?.id ? selection.size : null;

    function selectColor(color) {
        setSelection({ productId: product.id, color, size: selectedSize });
    }

    function selectSize(size) {
        setSelection({ productId: product.id, color: selectedColor, size });
    }

    if (!product) {
        return (
            <section className="product-view-page">
                <h2>Produto não encontrado</h2>
                <Link to="/produtos">
                    Voltar para os produtos
                </Link>
            </section>
        );
    }

    return (
        <section className="product-view-page">
            <div className="product-details">
                <div className="product-image">
                    <img
                        src={product.image}
                        alt={product.name}
                    />
                </div>

                <div className="product-info">
                    <p className="product-category">
                        {product.category}
                    </p>

                    <h2>{product.name}</h2>

                    <div className="product-prices">
                        <span className="original-price">
                            R$ {product.price.toFixed(2).replace(".", ",")}
                        </span>

                        <span className="discount-price">
                            R$ {product.priceDiscount.toFixed(2).replace(".", ",")}
                        </span>
                    </div>

                    <p className="product-discount">
                        {product.discount}% de desconto
                    </p>

                    <fieldset className="product-options">
                        <legend>Cor</legend>
                        <div className="product-color-options">
                            {product.colors.map((color) => (
                                <button
                                    className={`product-color-option${selectedColor === color ? " selected" : ""}`}
                                    key={color}
                                    type="button"
                                    aria-pressed={selectedColor === color}
                                    onClick={() => selectColor(color)}
                                >
                                    <span
                                        className={`product-color-swatch color-${color.toLowerCase()}`}
                                        aria-hidden="true"
                                    />
                                    {color}
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset className="product-options">
                        <legend>Tamanho</legend>
                        <div className="product-size-options">
                            {product.sizes.map((size) => (
                                <button
                                    className={`product-size-option${selectedSize === size ? " selected" : ""}`}
                                    key={size}
                                    type="button"
                                    aria-pressed={selectedSize === size}
                                    onClick={() => selectSize(size)}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    {(!selectedColor || !selectedSize) && (
                        <p className="product-selection-hint">
                            Selecione uma cor e um tamanho para continuar.
                        </p>
                    )}

                    <button
                        className="btn"
                        disabled={!selectedColor || !selectedSize}
                        onClick={() => addToCart(product, selectedColor, selectedSize)}
                    >
                        Comprar
                    </button>
                </div>
            </div>

            <Link to="/produtos" className="back-link">
                Voltar para os produtos
            </Link>
        </section>
    );
}

export default ProductViewPage;