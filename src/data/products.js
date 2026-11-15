import imagem1 from "../assets/produc-image-1.jpeg";
import imagem2 from "../assets/produc-image-2.jpeg";
import imagem3 from "../assets/produc-image-3.jpeg";
import imagem4 from "../assets/produc-image-4.jpeg";
import imagem5 from "../assets/produc-image-5.jpeg";

const availableColors = ["Azul", "Rosa", "Marrom"];
const availableSizes = [34, 35, 36, 38, 40, 41, 42];

const products = [
    {
        id: 1,
        name: "Tênis Casual Masculino",
        category: "Calçados",
        brand: "Nike",
        subcategory: "Casual",
        gender: "Masculino",
        condition: "Novo",
        colors: availableColors,
        sizes: availableSizes,
        image: imagem1,
        price: 299.90,
        priceDiscount: 249.90,
        discount: 17
    },
    {
        id: 2,
        name: "Tênis Casual Unissex",
        category: "Calçados",
        brand: "Adidas",
        subcategory: "Corrida",
        gender: "Unissex",
        condition: "Novo",
        colors: availableColors,
        sizes: availableSizes,
        image: imagem2,
        price: 259.90,
        priceDiscount: 199.90,
        discount: 23
    },
    {
        id: 3,
        name: "Tênis Feminino Casual",
        category: "Calçados",
        brand: "Puma",
        subcategory: "Esporte e lazer",
        gender: "Feminino",
        condition: "Novo",
        colors: availableColors,
        sizes: availableSizes,
        image: imagem3,
        price: 189.90,
        priceDiscount: 149.90,
        discount: 21
    },
    {
        id: 4,
        name: "Tênis Casual Unissex",
        category: "Calçados",
        brand: "Olympikus",
        subcategory: "Utilitário",
        gender: "Unissex",
        condition: "Usado",
        colors: availableColors,
        sizes: availableSizes,
        image: imagem4,
        price: 129.90,
        priceDiscount: 99.90,
        discount: 23
    },
    {
        id: 5,
        name: "Tênis Esportivo Masculino",
        category: "Calçados",
        brand: "Nike",
        subcategory: "Esporte e lazer",
        gender: "Masculino",
        condition: "Novo",
        colors: availableColors,
        sizes: availableSizes,
        image: imagem5,
        price: 129.90,
        priceDiscount: 99.90,
        discount: 23
    },
    {
        id: 6,
        name: "Tênis Feminino Casual",
        category: "Calçados",
        brand: "Adidas",
        subcategory: "Casual",
        gender: "Feminino",
        condition: "Novo",
        colors: availableColors,
        sizes: availableSizes,
        image: imagem3,
        price: 189.90,
        priceDiscount: 149.90,
        discount: 21
    },
    {
        id: 7,
        name: "Tênis Casual Unissex",
        category: "Calçados",
        brand: "Olympikus",
        subcategory: "Corrida",
        gender: "Unissex",
        condition: "Novo",
        colors: availableColors,
        sizes: availableSizes,
        image: imagem4,
        price: 129.90,
        priceDiscount: 99.90,
        discount: 23
    },
    {
        id: 8,
        name: "Tênis Esportivo Masculino",
        category: "Calçados",
        brand: "Puma",
        subcategory: "Utilitário",
        gender: "Masculino",
        condition: "Usado",
        colors: availableColors,
        sizes: availableSizes,
        image: imagem5,
        price: 129.90,
        priceDiscount: 99.90,
        discount: 23
    }
];

export default products;