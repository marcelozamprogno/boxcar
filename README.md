# 🚗 BoxCar Brasil — Mini Cooler Personalizado

Clone completo e funcional da loja oficial **[BoxCar Brasil](https://boxcarbrasil.shop/)**.

---

## 📦 Estrutura do Projeto

```text
├── index.html                 # Página principal do produto (Landing Page com personalizador de carros)
├── app.js                     # Lógica interativa de personalização, carros, kits e seleção
├── pricing.js                 # Regras de precificação e ofertas
├── vehicles.json              # Banco de dados de marcas, modelos e categorias de carros
├── assets/
│   └── styles-AmZeijte.css    # Estilização completa e responsiva da loja
├── brand/                     # Logotipos, ícones e insígnias oficiais
│   ├── boxcar-logo.svg
│   ├── boxcar-logo-white.svg
│   ├── boxcar-favicon.svg
│   ├── pix-logo.png
│   ├── pac-correios.png
│   └── sedex-correios.png
├── media/                     # Fotos em alta resolução e vídeos promocionais
│   ├── boxcar-main.png
│   ├── boxcar-personalizacao.png
│   ├── boxcar-capacidade.png
│   ├── boxcar-dimensoes.png
│   ├── f671f7a4-6cfb-401f-a9f9-86ad4c342659.mp4  # Vídeo demonstrativo
│   ├── bumps/                 # Imagens dos adicionais (chaveiro, porta-copos, bolsas de gelo)
│   ├── store/                 # Mídias da seção de presente
│   └── testimonials/          # Fotos das avaliações de clientes
├── checkout/
│   ├── index.html             # Fluxo completo de checkout (Identificação, Entrega com consulta de CEP e Pagamento)
│   ├── checkout.js            # Validações de CPF/CNPJ, viacep, cálculo de frete e integração Pix
│   ├── checkout.css           # Estilos do checkout
│   └── match-original.css
├── pix/
│   └── index.html             # Tela de confirmação e pagamento Pix com QR Code e Copia-e-Cola
├── politicas/
│   └── index.html             # Políticas de privacidade, termos de uso, reembolso e entrega
├── processar-pagamento.php     # Endpoint backend para processamento e geração de Pix
├── webhook-pix.php            # Endpoint webhook para confirmação automática de pagamentos
├── server.js                  # Servidor local Node.js sem dependências para testes imediatos
└── package.json
```

---

## 🚀 Como Executar Localmente

### Usando Node.js (Recomendado)

O projeto inclui um servidor HTTP nativo sem necessidade de instalar pacotes:

```bash
npm start
```
ou
```bash
node server.js
```

Em seguida, acesse no navegador:
👉 **`http://localhost:3000`**

---

### Usando PHP (Servidor embutido)

Se preferir rodar com o servidor embutido do PHP:

```bash
php -S localhost:8000
```

---

## 🛠️ Recursos Incluídos

- ✅ **Personalizador Dinâmico:** Frente/Traseira, categoria do veículo, marca, modelo, ano, cor e placa personalizada com renderização em tempo real.
- ✅ **Kits Promocionais:** 1 Unidade (R$ 97,00) ou 2 Unidades (R$ 129,00 com economia de R$ 65,00).
- ✅ **Checkout Completo em 3 Etapas:**
  - 1. Identificação com máscaras de CPF/CNPJ, WhatsApp e validação.
  - 2. Entrega com busca automática de endereço via CEP (ViaCEP) e opções PAC/SEDEX.
  - 3. Pagamento Pix com Order Bumps opcionais (chaveiro, porta-copos, placa de gelo).
- ✅ **Tela de Pagamento Pix Dedicada:** QR Code gerado dinamicamente, botão "Copiar Código Pix", cronômetro e polling de aprovação.
- ✅ **Página de Políticas e Termos:** Conforme normas do CDC e LGPD.
- ✅ **Design 100% Responsivo:** Otimizado para smartphones, tablets e desktop.
