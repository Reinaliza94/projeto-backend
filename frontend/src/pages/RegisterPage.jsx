import { useState } from "react";
import { registerUser } from "../api/client";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import "./RegisterPage.css";

const initialForm = {
    nome: "",
    sobrenome: "",
    email: "",
    senha: ""
};

function RegisterPage() {
    const [form, setForm] = useState(initialForm);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((currentForm) => ({
            ...currentForm,
            [name]: value
        }));
        setSubmitted(false);
        setError("");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            await registerUser({
                firstname: form.nome.trim(),
                surname: form.sobrenome.trim(),
                email: form.email.trim(),
                password: form.senha,
                confirmPassword: form.senha
            });
            setSubmitted(true);
            setForm(initialForm);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="register-page">
            <form className="register-form" onSubmit={handleSubmit}>
                <h1>Crie sua conta</h1>
                <p>Preencha seus dados para se cadastrar.</p>

                {submitted && (
                    <div className="register-success" role="status">
                        Cadastro realizado com sucesso. Faça login para continuar.
                    </div>
                )}
                {error && <div className="register-error" role="alert">{error}</div>}

                <div className="register-field">
                    <label htmlFor="nome">Nome</label>
                    <InputText
                        id="nome"
                        name="nome"
                        value={form.nome}
                        onChange={handleChange}
                        placeholder="Digite seu nome"
                        required
                    />
                </div>

                <div className="register-field">
                    <label htmlFor="sobrenome">Sobrenome</label>
                    <InputText
                        id="sobrenome"
                        name="sobrenome"
                        value={form.sobrenome}
                        onChange={handleChange}
                        placeholder="Digite seu sobrenome"
                        required
                    />
                </div>

                <div className="register-field">
                    <label htmlFor="email">E-mail</label>
                    <InputText
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Digite seu e-mail"
                        required
                    />
                </div>

                <div className="register-field">
                    <label htmlFor="senha">Senha</label>
                    <InputText
                        id="senha"
                        name="senha"
                        type="password"
                        value={form.senha}
                        onChange={handleChange}
                        placeholder="Digite sua senha"
                        minLength={6}
                        required
                    />
                </div>

                <Button
                    type="submit"
                    label="Criar conta"
                    className="register-submit"
                    disabled={submitting}
                />
            </form>
        </section>
    );
}

export default RegisterPage;
