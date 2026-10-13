# 🟢 Zappo

<div align="center">

![Zappo Logo](./public/logo192.png)

**Cliente desktop moderno, leve e ultrarrápido para WhatsApp construído com Tauri v2, Rust e React 19.**

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-orange.svg)](<>)
[![Versão](<https://img.shields.io/badge/versão-v0.1.0%20(não%20lançada)-yellow.svg>)](<>)
[![Licença](https://img.shields.io/badge/license-MIT-blue.svg)](<>)

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
- [ ] **Desduplicação ao Iniciar Nova Conversa:** Evitar duplicar ou recriar a conversa na barra lateral ao iniciar chat com um número com o qual o usuário já possui histórico prévio, redirecionando automaticamente para a conversa existente.
- [ ] **Menu Compacto ("...") no Topo da Conversa:** Adicionar menu dropdown com ícone de reticências verticais (`...`) no cabeçalho do chat ativo para agrupar e limpar os botões de ações rápidas superiores (limpar conversa, excluir chat, informações, etc.).
- [ ] **Efeito Sonoro de Notificação:** Tocar alerta sonoro agradável e discreto ao receber novas mensagens na conversa em segundo plano ou em primeiro plano.
- [ ] **Notificações de Sistema no Chat:** Exibir mensagens de sistema contextuais na timeline da conversa (ex: entrada/saída de membros, adições ao grupo, alterações de assunto ou permissões).
- [ ] **Tratamento e Ocultação de Mensagens Revogadas (Apagadas):**
    - Ocultar automaticamente mensagens revogadas da timeline com opção de visualizá-las sob demanda mediante clique.
    - Adicionar configuração nas preferências (ativa por padrão) para purgar permanentemente mensagens revogadas do banco de dados SQLite e apagar mídias em cache local.
- [ ] **Envio de Mensagens com Visualização Única (_View Once_):** Suporte ao envio de mídias temporárias efêmeras para fotos, vídeos e áudios gravados.
- [ ] **Gravação e Envio de Mensagens de Voz:** Implementar gravador de áudio integrado com microfone no rodapé da conversa para envio direto de notas de voz.
- [ ] **Validação do Envio de Reações aos Servidores:** Diagnosticar e garantir que as reações com emojis disparadas no cliente sejam confirmadas e sincronizadas remotamente junto aos servidores do WhatsApp.
- [ ] **Gerenciamento e Edição de Mensagens:** Permitir exclusão (para mim e para todos), edição de mensagens enviadas e moderação de mensagens por administradores.
- [x] **Formatação & Links:** Suporte completo à formatação Markdown do WhatsApp (_negrito_, _itálico_, ~tachado~, `código`) e detecção de links clicáveis.
- [ ] **Prévia de Links:** Buscar e exibir metadados ricos (título, descrição e imagem de capa) ao compartilhar links.
- [ ] **Enquetes:** Suporte para envio, visualização e votação em enquetes.
- [ ] **Canais de Transmissão:** Permitir acompanhamento e visualização de mensagens em canais oficiais.
- [ ] **Sincronização de Limpeza:** Aprimorar a sincronização ao limpar e excluir conversas junto aos servidores do WhatsApp.
- [x] **Reações a Mensagens:** Permitir adicionar e visualizar reações com emojis nas mensagens recebidas e enviadas.
- [x] **Expansão de Emojis:** Adicionar mais emojis ao acervo do seletor abrangendo animais, comidas, atividades e símbolos adicionais.
- [x] **Ver dados da mensagem:** Visualizar metadados técnicos de uma mensagem (ID, JID, timestamp, status, campos de criptografia).

### 👥 Gestão de Grupos e Contatos

- [x] **Fotos de Perfil dos Autores e Contatos:** Buscar, exibir e armazenar em cache as fotos de perfil de contatos, grupos e autores das mensagens nas conversas.
- [x] **Membros do Grupo:** Visualizar a lista detalhada de participantes e administradores do grupo.
- [x] **Adicionar Participantes:** Adicionar membros ao grupo, inclusive pessoas que não estejam salvas na agenda (diretamente pelo número).
- [x] **Sair de Grupos:** Adicionar opções para sair de grupos e silenciar notificações.
- [ ] **Abertura de Membros pelo Cabeçalho:** Exibir o modal detalhado de membros e dados do grupo ao clicar no nome ou avatar do grupo no topo da conversa.
- [ ] **Modal de Dados do Contato:** Visualizar cartão detalhado de informações do contato (foto em alta resolução, recado/status, telefone formatado, JID e botão de conversa rápida) ao clicar no nome do usuário no topo de uma conversa direta.
- [ ] **Formatação e Exibição Completa de Telefones nas Conversas:** Garantir a formatação internacional padronizada (+55 (XX) XXXXX-XXXX) de todos os números de telefone exibidos e corrigir locais onde o número de telefone de participantes está ausente ou oculto (especialmente no cabeçalho de mensagens em grupos, figurinhas e detalhes da conversa).
- [ ] **Formatação e Nomes na Lista de Participantes:** Formatar números de telefone no padrão internacional amigável e exibir nomes de exibição/push name recuperados do WhatsApp para todos os membros disponíveis.
- [ ] **Menu de Contexto para Membros do Grupo:** Adicionar menu contextual (botão direito ou menu de ações) para cada participante da lista com opções para remover membro (para admins), visualizar dados do contato, iniciar conversa privada direta ou promover/rebaixar admin.
- [ ] **Convidar para Grupo via Link:** Gerar, visualizar, copiar e revogar link de convite oficial do grupo (`chat.whatsapp.com`) quando o usuário for administrador ou quando a permissão estiver habilitada.
- [ ] **Perfil Pessoal da Sessão Ativa:** Permitir visualizar e consultar os dados cadastrais da própria conta conectada (número, nome de exibição, foto e status).
- [ ] **Renomear Sessão / Conta Conectada:** Permitir alterar o rótulo/nome identificador da conta no gerenciador de contas do aplicativo para melhor organização de múltiplas sessões.

### 🖼️ Mídias, Figurinhas e Documentos

- [ ] **Criar Figurinha a partir de Imagem do Chat:** Adicionar botão de ação rápida ("Criar Figurinha") no menu de contexto de qualquer imagem recebida ou enviada na conversa, convertendo-a automaticamente para sticker WebP com fundo transparente e proporções adequadas.
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

### 🔌 Integrações e APIs para Desenvolvedores

- [ ] **Servidor Local de REST API:** Servidor HTTP REST embutido e opcional (configurável nas preferências do app) para permitir automações e integrações de desenvolvedores com o WhatsApp (envio de mensagens, mídias e listagem de conversas).
- [ ] **Autenticação Multi-Conta por API Key:** Gerar e exigir token de autenticação (API Key) individual para cada sessão/conta ativa conectada ao aplicativo, assegurando isolamento completo entre as contas expostas via API.

### 📢 Status e Atualizações

- [ ] **Visualização de Status:** Visualizar postagens de status de contatos (fotos, vídeos e textos).
- [ ] **Publicação de Status:** Permitir a postagem de novas atualizações de status diretamente pelo aplicativo.

---

## 📜 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais detalhes.
