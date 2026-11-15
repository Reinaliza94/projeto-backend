import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProductCard from "../components/ProductCard/ProductCard";
import products from "../data/products";
import "./ProductListingPage.css";

const filterGroups = [
    {
        key: "brand",
        label: "Marca",
        options: ["Adidas", "Olympikus", "Nike", "Puma"]
    },
    {
        key: "subcategory",
        label: "Categoria",
        options: ["Esporte e lazer", "Casual", "Utilitário", "Corrida"]
    },
    {
        key: "gender",
        label: "Gênero",
        options: ["Masculino", "Feminino", "Unissex"]
    },
    {
        key: "condition",
        label: "Estado",
        options: ["Novo", "Usado"]
    },
    {
        key: "colors",
        label: "Cor",
        options: ["Azul", "Rosa", "Marrom"]
    },
    {
        key: "sizes",
        label: "Tamanho",
        options: [34, 35, 36, 38, 40, 41, 42]
    }
];

function normalizeText(value) {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function ProductListingPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q")?.trim() ?? "";
    const searchTokens = useMemo(
        () => normalizeText(query).split(/\s+/).filter(Boolean),
        [query]
    );
    const [selectedFilters, setSelectedFilters] = useState({
        brand: [],
        subcategory: [],
        gender: [],
        condition: [],
        colors: [],
        sizes: []
    });
    const [sortOrder, setSortOrder] = useState("relevance");

    const filteredProducts = useMemo(() => {
        const matchingProducts = products
            .map((product, index) => ({ product, index }))
            .filter(({ product }) => {
                const searchableText = normalizeText([
                    product.name,
                    product.category,
                    product.brand,
                    product.subcategory,
                    product.gender,
                    product.condition,
                    ...product.colors,
                    ...product.sizes
                ].join(" "));

                const matchesSearch = searchTokens.every((token) =>
                    searchableText.includes(token)
                );
                const matchesFilters = filterGroups.every(({ key }) =>
                    selectedFilters[key].length === 0
                    || selectedFilters[key].some((value) =>
                        (Array.isArray(product[key]) ? product[key] : [product[key]])
                            .some((productValue) =>
                                normalizeText(productValue) === normalizeText(value)
                            )
                    )
                );

                return matchesSearch && matchesFilters;
            });

        matchingProducts.sort((first, second) => {
            if (sortOrder === "price") {
                return first.product.priceDiscount - second.product.priceDiscount
                    || first.index - second.index;
            }

            const getRelevance = ({ product }) => {
                const normalizedName = normalizeText(product.name);
                const searchableText = normalizeText([
                    product.name,
                    product.category,
                    product.brand,
                    product.subcategory,
                    product.gender,
                    product.condition,
                    ...product.colors,
                    ...product.sizes
                ].join(" "));

                return searchTokens.reduce(
                    (score, token) => score + (normalizedName.includes(token) ? 2 : 1),
                    normalizedName.startsWith(normalizeText(query)) && query ? 3 : 0
                ) + (searchTokens.every((token) => searchableText.includes(token)) ? 1 : 0);
            };

            return getRelevance(second) - getRelevance(first)
                || first.index - second.index;
        });

        return matchingProducts.map(({ product }) => product);
    }, [query, searchTokens, selectedFilters, sortOrder]);

    function toggleFilter(group, value) {
        setSelectedFilters((currentFilters) => {
            const currentValues = currentFilters[group];
            const updatedValues = currentValues.includes(value)
                ? currentValues.filter((item) => item !== value)
                : [...currentValues, value];

            return {
                ...currentFilters,
                [group]: updatedValues
            };
        });
    }

    function clearFilters() {
        setSelectedFilters({
            brand: [],
            subcategory: [],
            gender: [],
            condition: [],
            colors: [],
            sizes: []
        });
    }

    return (
        <section className="product-listing-page catalog-page">
            <header className="catalog-header">
                <h2>{query ? `Resultados para "${query}"` : "Todos os produtos"}</h2>
                <p>
                    {query
                        ? "Use os filtros para refinar sua busca."
                        : "Confira nossas novidades e encontre seu estilo!"}
                </p>
            </header>

            <div className="catalog-layout">
                <aside className="catalog-filters" aria-label="Filtros de produtos">
                    <div className="catalog-filters-heading">
                        <h3>Filtrar por</h3>
                        <button type="button" onClick={clearFilters}>
                            Limpar
                        </button>
                    </div>

                    {filterGroups.map(({ key, label, options }) => (
                        <fieldset className="catalog-filter-group" key={key}>
                            <legend>{label}</legend>
                            {options.map((option) => (
                                <label className="catalog-filter-option" key={option}>
                                    <input
                                        type="checkbox"
                                        checked={selectedFilters[key].includes(option)}
                                        onChange={() => toggleFilter(key, option)}
                                    />
                                    <span>{option}</span>
                                </label>
                            ))}
                        </fieldset>
                    ))}
                </aside>

                <div className="catalog-results">
                    <div className="catalog-toolbar">
                        <p aria-live="polite">
                            {filteredProducts.length}{" "}
                            {filteredProducts.length === 1
                                ? "produto encontrado"
                                : "produtos encontrados"}
                        </p>

                        <label className="catalog-sort">
                            <span>Ordenar por</span>
                            <select
                                value={sortOrder}
                                onChange={(event) => setSortOrder(event.target.value)}
                            >
                                <option value="relevance">Mais relevantes</option>
                                <option value="price">Menor preço</option>
                            </select>
                        </label>
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="catalog-products-grid">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <p className="catalog-empty-state">
                            Nenhum produto encontrado. Tente alterar a busca ou os filtros.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}

export default ProductListingPage;
