import { Link } from "react-router-dom";
import { useCatalog } from "../context/useCatalog";
import "../pages/CategoriesPage.css";

const categoryPresentation = {
    roupas: {
        icon: "pi-tag",
        description: "Camisetas, calças e muito mais."
    },
    calcados: {
        icon: "pi-shopping-bag",
        description: "Tênis, sandálias e sapatos."
    },
    acessorios: {
        icon: "pi-sparkles",
        description: "Bonés, bolsas e acessórios."
    },
    eletronicos: {
        icon: "pi-headphones",
        description: "Headphones e outros produtos."
    }
};

function categoryKey(name) {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function CategoriesPage() {
    const { categories, loading, error } = useCatalog();

    return (
        <section className="categories-page">
            <h2>Explore nossas categorias</h2>

            <p>
                Encontre os produtos ideais para o seu estilo!
            </p>

            <div className="categories-list">
                {loading && <p>Carregando categorias...</p>}
                {error && <p role="alert">Não foi possível carregar as categorias: {error}</p>}
                {!loading && !error && categories.length === 0 && (
                    <p>Nenhuma categoria disponível no momento.</p>
                )}
                {categories.map((category) => {
                    const presentation = categoryPresentation[categoryKey(category.name)] ?? {};
                    return (
                        <Link
                            className="category-item"
                            key={category.id}
                            to={`/produtos?category_id=${category.id}`}
                        >
                            <i
                                className={`pi ${presentation.icon ?? "pi-tag"} category-icon`}
                                aria-hidden="true"
                            />
                            <h3>{category.name}</h3>
                            <p>{presentation.description ?? "Confira os produtos desta categoria."}</p>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

export default CategoriesPage;