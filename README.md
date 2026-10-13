# 🟢 Zappo

<div align="center">

![Zappo Logo](./public/logo.svg)

**Cliente desktop moderno, leve e ultrarrápido para WhatsApp construído com Tauri v2, Rust e React 19.**

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-orange.svg)]()
[![Versão](<https://img.shields.io/badge/versão-v0.1.0%20(não%20lançada)-yellow.svg>)]()
[![Licença](https://img.shields.io/badge/license-MIT-blue.svg)]()

</div>

---

> [!WARNING]
> **Status de Lançamento:** A versão **`v0.1.0` ainda NÃO foi lançada oficialmente**.  
> O aplicativo está atualmente em fase de desenvolvimento ativo (_pre-release_ / _WIP_). Novas funcionalidades e refinamentos estão sendo adicionados continuamente.

---

## ✨ Funcionalidades Atuais

- 🔐 **Multi-Contas Isoladas:** Gerencie múltiplas contas simultâneas com bancos de dados SQLite e diretórios de mídia 100% isolados.
- 📱 **Conexão Flexível:** Pareamento rápido via QR Code ou por Código de Pareamento numérico (8 dígitos por telefone).
- 💬 **Mensageria Completa:** Envio e recebimento em tempo real de mensagens de texto, imagens, vídeos, áudios/mensagens de voz, documentos e figurinhas (_stickers_).
- 🎨 **Criação de Figurinhas:** Converta qualquer imagem (PNG, JPG, WebP) em figurinhas nativas com recorte e proporção otimizados (512x512 WebP).
- 😃 **Emojis & Figurinhas Recentes:** Seletor de emojis categorizados com suporte à tipografia Google Noto Color Emoji e galeria de figurinhas recebidas.
- 🖼️ **Preview de Mídia:** Miniaturas com _blur_ estético e download sob demanda de fotos, vídeos e documentos.
- ➕ **Nova Conversa Descomplicada:** Inicie conversas diretas com qualquer número sem precisar salvá-lo na lista de contatos.
- 🧹 **Gerenciamento de Armazenamento:** Estatísticas de uso por categoria (fotos, vídeos, áudios, documentos, stickers), limpeza de cache e otimização (_vacuum_) da base de dados.
- 🌗 **Design Premium:** Interface moderna com tema escuro e claro, construída com Tailwind CSS 4 e componentes Shadcn UI.

---

## 🛠 Tech Stack

- **Desktop Framework:** [Tauri v2](https://tauri.app/)
- **Frontend:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 7](https://vite.dev/)
- **Backend Nativo:** [Rust](https://www.rust-lang.org/) + [`whatsapp-rust`](https://crates.io/crates/whatsapp-rust)
- **Estilização:** [Tailwind CSS 4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Ícones:** [react-icons (Lucide)](https://react-icons.github.io/react-icons/)
- **Validação de Schemas:** [Zod v4](https://zod.dev/)
- **Armazenamento:** SQLite local (via `rusqlite` e `whatsapp-rust-sqlite-storage`)

---

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 20+)
- [Rust & Cargo](https://rustup.rs/) (versão estável mais recente)

### Passos

1. **Instalar dependências do frontend:**

    ```bash
    npm install
    ```

2. **Iniciar o ambiente de desenvolvimento (Tauri + Vite):**

    ```bash
    npm run tauri dev
    ```

3. **Compilar para produção:**
    ```bash
    npm run tauri build
    ```

---

## 📋 Roadmap / A Fazer (TODO)

Lista de melhorias e novas funcionalidades planejadas para as próximas versões:

- [ ] Consertar nomes dos grupos
- [ ] Puxar foto de perfil de pessoas e grupos
- [ ] Adicionar possibilidade de incluir legendas em mídias e documentos
- [ ] Adicionar opção de abrir imagem (ampliar após o clique)
- [ ] Puxar figurinhas favoritas
- [ ] Adicionar figurinhas aos favoritos
- [ ] Criar figurinhas a partir de vídeo
- [ ] Corrigir erro de mensagens fantasmas em grupos
- [ ] Adicionar opção de sair do grupo
- [ ] Adicionar opções para ver membros do grupo
- [ ] Adicionar opções para adicionar pessoas no grupo (inclusive pessoas que não temos o contato, apenas pelo número)
- [ ] Corrigir sincronização de limpeza de chat
- [ ] Corrigir download automático desativado de mídias
- [ ] Permitir visualização de PDF
- [ ] Permitir edição básica de imagem antes de enviá-la (recorte, rabisco, adição de texto)
- [ ] Permitir a visualização de status
- [ ] Permitir a publicação de status
- [ ] Permitir o envio e resposta de enquetes
- [ ] Permitir o markdown do whatsapp e links
- [ ] Buscar metadados dos links (e foto)
- [ ] Permitir visualização de mensagens de canais
- [ ] Permitir o envio de mensagens de visualização única
- [ ] Mostrar a foto, o nome e o número do autor da mensagem enviada no grupo
- [ ] Permitir exclusão e edição das mensagens

---

## 📜 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais detalhes.
