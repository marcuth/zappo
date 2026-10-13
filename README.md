# 🟢 Zappo

<div align="center">

![Zappo Logo](./public/logo192.png)

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

Lista de melhorias, correções e novas funcionalidades planejadas para as próximas versões:

### 💬 Mensagens e Conversas

- [x] **Sincronização de Grupos:** Corrigir a identificação e exibição dos nomes corretos dos grupos.
- [x] **Identificação em Grupos:** Exibir foto de perfil, nome e número de telefone do autor de cada mensagem enviada no grupo.
- [x] **Formatação do Número do Autor:** Corrigir a exibição do telefone do autor nas mensagens de grupo (evitar exibir o ID bruto ou formatação incorreta).
- [x] **Agrupamento de Mensagens:** Agrupar mensagens sequenciais do mesmo autor na conversa, evitando repetição desnecessária de nome, foto e número.
- [x] **Compactação de Mensagens Longas:** Implementar recolhimento com botão "Ler mais..." para mensagens com textos muito extensos.
- [x] **Mensagens Fantasmas:** Corrigir anomalia de mensagens fantasmas ou duplicadas em conversas em grupo.
- [ ] **Gerenciamento e Exclusão de Mensagens:** Permitir exclusão (para mim e para todos), edição de mensagens enviadas e exclusão de mensagens de outros participantes quando for administrador do grupo.
- [x] **Formatação & Links:** Suporte completo à formatação Markdown do WhatsApp (_negrito_, _itálico_, ~tachado~, `código`) e detecção de links clicáveis.
- [ ] **Prévia de Links:** Buscar e exibir metadados ricos (título, descrição e imagem de capa) ao compartilhar links.
- [ ] **Enquetes:** Suporte para envio, visualização e votação em enquetes.
- [ ] **Mensagens de Visualização Única:** Permitir o envio e a visualização de mídias temporárias (_view once_).
- [ ] **Canais de Transmissão:** Permitir acompanhamento e visualização de mensagens em canais oficiais.
- [ ] **Sincronização de Limpeza:** Aprimorar a sincronização ao limpar e excluir conversas junto aos servidores do WhatsApp.
- [x] **Reações a Mensagens:** Permitir adicionar e visualizar reações com emojis nas mensagens recebidas e enviadas.
- [x] **Expansão de Emojis:** Adicionar mais emojis ao acervo do seletor abrangendo animais, comidas, atividades e símbolos adicionais.
- [x] **Ver dados da mensagem:** Visualizar metadados técnicos de uma mensagem (ID, JID, timestamp, status, campos de criptografia).

### 👥 Gestão de Grupos e Contatos

- [ ] **Fotos de Perfil dos Autores e Contatos:** Buscar, exibir e armazenar em cache as fotos de perfil de contatos, grupos e autores das mensagens nas conversas.
- [ ] **Membros do Grupo:** Visualizar a lista detalhada de participantes e administradores do grupo.
- [ ] **Adicionar Participantes:** Adicionar membros ao grupo, inclusive pessoas que não estejam salvas na agenda (diretamente pelo número).
- [ ] **Sair de Grupos:** Adicionar opções para sair de grupos e silenciar notificações.

### 🖼️ Mídias, Figurinhas e Documentos

- [x] **Legendas em Anexos:** Adicionar suporte à inclusão de legendas personalizadas em fotos, vídeos e documentos.
- [x] **Visualizador de Imagens (Lightbox):** Permitir clicar na imagem para expandi-la em tela cheia com zoom e navegação.
- [x] **Download e Salvamento de Imagens:** Corrigir a ação de baixar imagem para abrir o diálogo nativo do sistema operacional ("Salvar como") escolhendo o destino do arquivo, em vez de redirecionar para a página/URL da imagem.
- [ ] **Editor de Imagens:** Ferramentas básicas de edição antes do envio (recorte, rabisco/desenho livre e inserção de textos).
- [x] **Visualizador de PDF:** Prévia e leitura integrada de documentos PDF diretamente no aplicativo.
- [x] **Pesquisa de Emojis:** Corrigir busca e filtragem no seletor de emojis.
- [x] **Identificação em Envio de Figurinhas:** Exibir o cabeçalho/nome do autor ao enviar figurinhas isoladas em grupos (quando não houver mensagem anterior dele).
- [ ] **Figurinhas Favoritas:** Sincronizar figurinhas favoritas da conta e permitir favoritar novas figurinhas recebidas.
- [ ] **Criação de Figurinhas por Vídeo:** Criar figurinhas animadas a partir de trechos de vídeo ou GIFs.
- [x] **Download Automático:** Corrigir e refinar a desativação do download automático de mídias de acordo com as preferências do usuário.

### 📢 Status e Atualizações

- [ ] **Visualização de Status:** Visualizar postagens de status de contatos (fotos, vídeos e textos).
- [ ] **Publicação de Status:** Permitir a postagem de novas atualizações de status diretamente pelo aplicativo.

---

## 📜 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais detalhes.
