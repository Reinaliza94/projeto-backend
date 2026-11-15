import "../pages/CategoriesPage.css";
function CategoriesPage() {
    return (
        <section className="categories-page">
            <h2>Explore nossas categorias</h2>

            <p>
                Encontre os produtos ideais para o seu estilo!
            </p>

            <div className="categories-list">
                <div className="category-item">
                    <i className="pi pi-tag category-icon" aria-hidden="true"></i>
                    <h3>Roupas</h3>
                    <p>Camisetas, calças e muito mais.</p>
                </div>

                <div className="category-item">
                    <i className="pi pi-shopping-bag category-icon" aria-hidden="true"></i>
                    <h3>Calçados</h3>
                    <p>Tênis, sandálias e sapatos.</p>
                </div>

                <div className="category-item">
                    <i className="pi pi-sparkles category-icon" aria-hidden="true"></i>
                    <h3>Acessórios</h3>
                    <p>Bonés, bolsas e acessórios.</p>
                </div>

                <div className="category-item">
                    <i className="pi pi-headphones category-icon" aria-hidden="true"></i>
                    <h3>Eletrônicos</h3>
                    <p>Headphones e outros produtos.</p>
                </div>
            </div>
        </section>
    );
}

export default CategoriesPage;