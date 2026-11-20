import { useEffect, useState } from "react";
import { getCategories, getProducts } from "../api/client";
import CatalogContext from "./catalog-context";

function normalizeText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function optionValues(options, title) {
    return options
        .filter((option) => normalizeText(option.title) === normalizeText(title))
        .flatMap((option) => option.values.split(",").map((value) => value.trim()))
        .filter(Boolean);
}

function mapProduct(product, categories) {
    const options = product.options ?? [];
    const productCategories = (product.category_ids ?? [])
        .map((id) => categories.find((category) => category.id === id))
        .filter(Boolean);
    const price = Number(product.price);
    const priceDiscount = Number(product.price_with_discount);

    return {
        ...product,
        price,
        priceDiscount,
        discount: price > 0
            ? Math.round(((price - priceDiscount) / price) * 100)
            : 0,
        image: product.images?.[0]?.content ?? "",
        colors: optionValues(options, "Cor"),
        sizes: optionValues(options, "Tamanho").map((size) =>
            /^\d+$/.test(size) ? Number(size) : size
        ),
        brand: optionValues(options, "Marca")[0] ?? "",
        subcategory: optionValues(options, "Subcategoria")[0] ?? "",
        gender: optionValues(options, "Gênero")[0] ?? "",
        condition: optionValues(options, "Estado")[0] ?? "",
        category: productCategories.map((category) => category.name).join(", "),
        categories: productCategories.map((category) => category.name),
        categoryIds: product.category_ids ?? []
    };
}

export function CatalogProvider({ children }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        Promise.all([getProducts(), getCategories()])
            .then(([productResult, categoryResult]) => {
                if (!active) {
                    return;
                }

                const loadedCategories = categoryResult.data;
                setCategories(loadedCategories);
                setProducts(
                    productResult.data
                        .filter((product) => product.enabled !== false)
                        .map((product) => mapProduct(product, loadedCategories))
                );
            })
            .catch((requestError) => {
                if (active) {
                    setError(requestError.message);
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    return (
        <CatalogContext.Provider value={{ products, categories, loading, error }}>
            {children}
        </CatalogContext.Provider>
    );
}
