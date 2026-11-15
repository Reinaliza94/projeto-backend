import './Footer.css';
import logo_footer from '../../assets/logo-footer.svg';

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-content">
        <div className="footer-brand">
          <img className="footer-logo" src={logo_footer} alt="Drip Store" />
          <p className="footer-description">
            Acompanhe as novidades e encontre seu próximo estilo na Drip Store.
          </p>
          <div className="footer-redes">
            <h3>Redes sociais</h3>
            <div className="footer-social-icons">
              <i className="pi pi-instagram"></i>
              <i className="pi pi-facebook"></i>
              <i className="pi pi-twitter"></i>
            </div>
          </div>
        </div>

        <div>
          <h3>Informação</h3>
          <p>Sobre Drip Store</p>
          <p> Segurança</p>
          <p> Wish List</p>
          <p> Blog </p>
          <p> Trabalhe conosco</p>
          <p>Meus pedidos</p>
        </div>

        <div>
          <h3>Categorias</h3>
          <p>Camisetas</p>
          <p>Calças</p>
          <p>Bonés</p>
          <p>Headphones</p>
          <p>Tênis</p>
        </div>

        <div className="footer-contact">
          <h3>Contato</h3>
          <p>Informações meramente ilustrativas, não representam a realidade.</p>
          <p>Telefone: (11) 1234-5678</p>
          <p>Email: contato@dripstore.com</p>
        </div>
      </div>

      <div className="footer-credits">
        © 2026 Drip Store
      </div>

    </footer>
  );
}

export default Footer;