# 🚗 BoxCar Brasil — Mini Cooler Personalizado

Repositório oficial da plataforma de e-commerce da **BoxCar Brasil**.

---

## 📦 Estrutura do Projeto

```text
├── index.html                 # Página principal do produto (Landing Page com personalizador de carros)
├── app.js                     # Lógica interativa de personalização de veículos
├── pricing.js                 # Regras de precificação e ofertas
├── vehicles.json              # Banco de dados de marcas, modelos e categorias de carros
├── assets/                    # Estilização completa e responsiva da loja
├── brand/                     # Logotipos, ícones e insígnias oficiais
├── media/                     # Fotos em alta resolução e vídeos promocionais
├── checkout/                  # Fluxo completo de checkout transparente
│   ├── index.html
│   ├── checkout.js
│   └── checkout.css
├── pix/                       # Tela de pagamento Pix com QR Code e Copia-e-Cola
│   └── index.html
├── politicas/                 # Políticas de privacidade, termos de uso, reembolso e entrega
├── api/                       # Funções serverless de pagamento e webhooks (InvictusPay)
│   ├── processar-pagamento.js
│   └── webhook.js
└── vercel.json                # Configurações de deploy
```

---

## 🛠️ Recursos

- ✅ **Personalizador Dinâmico:** Frente/Traseira, categoria do veículo, marca, modelo, ano, cor e placa personalizada em tempo real.
- ✅ **Oferta Principal:** 1 Unidade BoxCar personalizada por R$ 147,00.
- ✅ **Checkout Completo em 3 Etapas:**
  - 1. Identificação com validação de CPF/CNPJ e celular.
  - 2. Entrega com busca automática de endereço via CEP (ViaCEP) e opções PAC/SEDEX.
  - 3. Pagamento Pix dinâmico com integração de gateway oficial.
- ✅ **Integração Gateway InvictusPay:** Geração de Pix dinâmico, confirmação automática e webhook.
- ✅ **Página de Políticas e Termos:** Conforme normas do CDC e LGPD.
- ✅ **Design 100% Responsivo:** Otimizado para smartphones, tablets e desktop.
