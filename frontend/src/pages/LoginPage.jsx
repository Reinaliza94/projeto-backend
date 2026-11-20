import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useAuth } from "../context/useAuth";
import "./LoginPage.css";

function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setSubmitting(true);
        setError("");

        try {
            await login(formData.get("email"), formData.get("senha"));
            navigate(location.state?.from || "/produtos", { replace: true });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="login-page">
            <form className="login-form" onSubmit={handleSubmit}>
                <h1>Acesse sua conta</h1>
                <p>Informe seu e-mail e senha para continuar.</p>

                {error && <div className="login-error" role="alert">{error}</div>}

                <div className="login-field">
                    <label htmlFor="login">E-mail</label>
                    <InputText
                        id="login"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Digite seu e-mail"
                        required
                    />
                </div>

                <div className="login-field">
                    <label htmlFor="senha">Senha</label>
                    <InputText
                        id="senha"
                        name="senha"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Digite sua senha"
                        required
                    />
                </div>

                <Link className="login-forgot-link" to="/recuperar-senha">
                    Esqueci minha senha
                </Link>

                <Button
                    type="submit"
                    label="Entrar"
                    className="login-submit"
                    disabled={submitting}
                />

                <p className="login-register-prompt">
                    Ainda não tem uma conta?{" "}
                    <Link to="/cadastro">Cadastre-se</Link>
                </p>
            </form>
        </section>
    );
}

export function PasswordRecoveryPage() {
    const [submitted, setSubmitted] = useState(false);

    function handleSubmit(event) {
        event.preventDefault();
        setSubmitted(true);
    }

    return (
        <section className="login-page">
            <form className="login-form" onSubmit={handleSubmit}>
                <h1>Recuperar senha</h1>
                <p>Informe seu e-mail para receber as instruções de recuperação.</p>

                {submitted && (
                    <div className="login-message" role="status">
                        Se houver uma conta com este e-mail, você receberá as instruções.
                    </div>
                )}

                <div className="login-field">
                    <label htmlFor="email-recuperacao">E-mail</label>
                    <InputText
                        id="email-recuperacao"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Digite seu e-mail"
                        required
                    />
                </div>

                <Button
                    type="submit"
                    label="Enviar instruções"
                    className="login-submit"
                />

                <Link className="login-back-link" to="/login">
                    Voltar para o login
                </Link>
            </form>
        </section>
    );
}

export default LoginPage;
