import { useState } from "react";
import { Link } from "react-router-dom";
import "../pages/HomePage.css";
import ProductCard from "../components/ProductCard/ProductCard";
import { useCatalog } from "../context/useCatalog";
import slide1 from "../assets/home-slide-1-transparent.png";
import slide2 from "../assets/home-slide-2-transparent.png";
import slide3 from "../assets/home-slide-3-transparent.png";
import slide4 from "../assets/home-slide-4-transparent.png";
import slide5 from "../assets/home-slide-5-transparent.png";
import slide6 from "../assets/home-slide-6-transparent.png";
import slide7 from "../assets/home-slide-7-transparent.png";
import slide8 from "../assets/home-slide-8-transparent.png";
import collection1 from "../assets/collection-1.png";
import collection2 from "../assets/collection-2.png";
import collection3 from "../assets/collection-3.png";

const galleryImages = [
    { src: slide1, alt: "Coleção de moda Drip Store" },
    { src: slide2, alt: "Inspiração de look Drip Store" },
    { src: slide3, alt: "Destaque da coleção Drip Store" },
    { src: slide4, alt: "Novidades da Drip Store" },
    { src: slide5, alt: "Inspiração para seu próximo look" },
    { src: slide6, alt: "Peças em destaque da coleção" },
    { src: slide7, alt: "Estilo e novidades Drip Store" },
    { src: slide8, alt: "Confira mais da coleção Drip Store" },
];

const featuredCollections = [
    { src: collection1, alt: "Coleção em destaque da Drip Store" },
    { src: collection2, alt: "Mais opções da coleção Drip Store" },
    { src: collection3, alt: "Novidades da coleção Drip Store" },
];

function HomePage() {
    const [activeSlide, setActiveSlide] = useState(0);
    const { products, loading, error } = useCatalog();

    function showSlide(index) {
        setActiveSlide((index + galleryImages.length) % galleryImages.length);
    }

    return (
        <section className="home-page">
            <section className="home-gallery" aria-label="Galeria de imagens">
                <div className="home-gallery-slide">
                    <div className="home-offer">
                        <h4>Melhores ofertas personalizadas</h4>
                        <h1>
                            Queima de
                            <br />
                            estoque Nike! 🔥
                        </h1>
                        <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Voluptatibus odio cum impedit, ab distinctio!</p>
                        <Link className="btn" to="/produtos">Ver Ofertas</Link>
                    </div>
                    <div className="home-gallery-visual">
                        <img
                            src={galleryImages[activeSlide].src}
                            alt={galleryImages[activeSlide].alt}
                        />
                        <button
                            className="home-gallery-control home-gallery-previous"
                            type="button"
                            aria-label="Imagem anterior"
                            onClick={() => showSlide(activeSlide - 1)}
                        >
                            &#8249;
                        </button>
                        <button
                            className="home-gallery-control home-gallery-next"
                            type="button"
                            aria-label="Próxima imagem"
                            onClick={() => showSlide(activeSlide + 1)}
                        >
                            &#8250;
                        </button>
                    </div>
                </div>
                <div className="home-gallery-indicators" aria-label="Selecionar imagem">
                    {galleryImages.map((image, index) => (
                        <button
                            key={image.src}
                            type="button"
                            className={index === activeSlide ? "active" : ""}
                            aria-label={`Mostrar imagem ${index + 1}`}
                            aria-current={index === activeSlide ? "true" : undefined}
                            onClick={() => showSlide(index)}
                        />
                    ))}
                </div>
            </section>

            <section
                className="featured-collections"
                aria-labelledby="featured-collections-title"
            >
                <h2 id="featured-collections-title">Coleções em destaque</h2>
                <div className="featured-collections-grid">
                    {featuredCollections.map((collection) => (
                        <img
                            key={collection.src}
                            src={collection.src}
                            alt={collection.alt}
                            loading="lazy"
                        />
                    ))}
                </div>
            </section>

            <section
                className="trending-products"
                aria-labelledby="trending-products-title"
            >
                <div className="trending-products-header">
                    <h2 id="trending-products-title">Produtos em alta</h2>
                    <Link className="trending-products-link" to="/produtos">
                        Ver todos
                    </Link>
                </div>
                <div className="trending-products-grid">
                    {loading && <p>Carregando produtos...</p>}
                    {error && <p role="alert">Não foi possível carregar os produtos: {error}</p>}
                    {!loading && !error && products.length === 0 && (
                        <p>Nenhum produto disponível no momento.</p>
                    )}
                    {products.slice(0, 8).map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                        />
                    ))}
                </div>
            </section>

            <section
                className="special-offer"
                aria-labelledby="special-offer-title"
            >
                {products[0] && (
                    <>
                        <div className="home-offer special-offer-copy">
                            <p className="special-offer-label">Oferta especial</p>
                            <h1 id="special-offer-title">{products[0].name}</h1>
                            <p className="special-offer-description">
                                Conforto e estilo para acompanhar você em todos os momentos.
                            </p>
                            <Link className="btn" to="/produtos">Ver ofertas</Link>
                        </div>
                        {products[0].image && (
                            <img
                                className="special-offer-image"
                                src={products[0].image}
                                alt={products[0].name}
                                loading="lazy"
                            />
                        )}
                    </>
                )}
            </section>
        </section>
    );
}

export default HomePage;