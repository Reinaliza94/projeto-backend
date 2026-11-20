
import { Link } from "react-router-dom";
import "./ProductCard.css";

function ProductCard({ product }) {
    return (
        <div className="product-card">

            <Link
                to={`/produto/${product.id}`}
                className="product-image-link"
            >
                <div className="product-image">
                    {product.image && (
                        <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                        />
                    )}

                    {product.discount > 0 && (
                        <span className="discount-tag">
                            {product.discount}% OFF
                        </span>
                    )}
                </div>
            </Link>

            <div className="product-info">

                <p className="product-category">
                    {product.category}
                </p>

                <h3>{product.name}</h3>

                <div className="product-prices">
                    <span className="original-price">
                        R$ {product.price.toFixed(2).replace(".", ",")}
                    </span>

                    <span className="discount-price">
                        R$ {product.priceDiscount.toFixed(2).replace(".", ",")}
                    </span>
                </div>

            </div>

        </div>
    );
}

export default ProductCard;
