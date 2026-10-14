# 🟢 Zappo

<div align="center">

![Zappo Logo](./public/logo192.png)

**Cliente desktop moderno, ultraleve e de alta performance para WhatsApp construído com Tauri v2, Rust e React 19.**

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-orange.svg)]()
[![Versão](<https://img.shields.io/badge/versão-v0.1.0%20(pre--release)-yellow.svg>)]()
[![Licença](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![Memória](https://img.shields.io/badge/RAM-~48MB-brightgreen.svg)]()
[![Electron](https://img.shields.io/badge/Electron-Zero-success.svg)]()

</div>

---

> [!NOTE]
> **Status do Projeto:** A versão **`v0.1.0` é uma prévia ativa de desenvolvimento (_pre-release_)**.  
> O Zappo foi projetado como uma alternativa nativa de consumo ultrabaixo de memória (~48 MB de RAM) ao WhatsApp Desktop e Web baseados em Electron. Novas funcionalidades e refinamentos são incorporados continuamente.

---

## ✨ Destaques e Funcionalidades

### 🔐 Multi-Contas & Sessões Isoladas

- **Multi-Sessões Simultâneas:** Conecte e alterne entre múltiplas contas do WhatsApp de maneira fluida.
- **Isolamento Total:** Cada sessão possui armazenamento SQLite e diretórios de mídias criptografadas totalmente segregados.
- **Renomeação de Sessões:** Personalize os nomes de identificação de cada conta conectada.
- **Perfil Cadastral da Sessão Ativa:** Visualize cartão completo com número de telefone formatado, foto em alta resolução, push name, JID e recado/status da conta conectada.

### 💬 Mensageria & Conversas

- **Comunicação em Tempo Real:** Envio e recebimento imediato de mensagens com status de entrega e leitura.
- **Detecção Inteligente de Autoria:** Notificações sonoras (`notification.mp3`) ativadas exclusivamente para mensagens de terceiros, com supressão garantida para mensagens enviadas por você (incluindo eco de múltiplos aparelhos).
- **Formatação Rica & Markdown:** Suporte completo a formatação WhatsApp (_negrito_, _itálico_, ~tachado~ e `código monospaçado`) com links clicáveis.
- **Gravação de Áudio Nativa:** Gravador de voz integrado via microfone com envio direto e balão de áudio waveform com controle de velocidade (1x, 1.5x, 2x).
- **Reações com Emojis:** Reações rápidas sobre qualquer mensagem com seletor completo de emojis.
- **Mensagens com Visualização Única (_View Once_):** Envio e identificação com badge `① Visualização única`.
- **Tratamento de Mensagens Revogadas (Apagadas):** Ocultação inteligente com revelação sob demanda e purga permanente opcional de banco e mídias.
- **Compactação de Textos Longos:** Leitura confortável com recolhimento expansível ("Ler mais...").
- **Metadados da Mensagem:** Visualizador de dados técnicos (ID, stanza, timestamp, status de entrega e chaves criptográficas).

### 👥 Grupos & Contatos

- **Link Oficial de Convite de Grupos:** Gere, visualize, copie e redefina links oficiais (`chat.whatsapp.com`) diretamente pelo modal do grupo.
- **Gestão de Participantes:** Modal detalhado com foto, nome de exibição, número formatado no padrão internacional (+55...) e marcação de administradores.
- **Ações Rápidas por Participante:** Menu contextual em cada membro para iniciar conversa direta em particular ou copiar número/JID.
- **Adição Direta por Número:** Adicione novos membros a qualquer grupo digitando apenas o número de telefone, sem necessidade de salvá-lo na agenda.
- **Controle de Notificações:** Silencie conversas ou grupos por períodos pré-definidos (8 horas, 1 semana ou sempre).
- **Cartão do Contato:** Modal detalhado de contato acessível pelo topo da conversa com foto ampliada, recado, JID e telefone formatado.
- **Nova Conversa Descomplicada:** Inicie conversas diretas com qualquer número sem precisar adicioná-lo aos contatos do celular.

### 🖼️ Mídias, Figurinhas & Documentos

- **Conversão de Imagem para Figurinha:** Botão de ação rápida no menu de qualquer imagem para convertê-la imediatamente em sticker WebP 512x512.
- **Editor de Imagens Integrado:** Ajustes de brilho, contraste, filtros artísticos (P&B, Sépia, Vintage), corte (1:1, 4:5, Original) e rotação 90° antes do envio.
- **Visualizador de Mídias (Lightbox):** Modal em tela cheia com zoom, download nativo ("Salvar como...") e navegação sequencial entre mídias da conversa.
- **Visualizador de Documentos PDF:** Leitura e pré-visualização de arquivos PDF diretamente no aplicativo.
- **Download Seletivo:** Controle granular de download automático por tipo de arquivo (fotos, vídeos, áudios, documentos e figurinhas) e limite configurável de tamanho (MB).

### 🧹 Armazenamento & Performance

- **Painel de Armazenamento:** Gráficos e estatísticas de consumo por categoria (banco de dados, imagens, vídeos, áudios, documentos e cache).
- **Limpeza Inteligente:** Liberação seletiva de arquivos antigos por categoria ou por conversa individual.
- **Otimização SQLite (Vacuum):** Desfragmentação e redução do tamanho físico do banco de dados local com 1 clique.

---

## 🛠 Tech Stack

| Camada                | Tecnologia                                                                                     | Descrição                                                  |
| :-------------------- | :--------------------------------------------------------------------------------------------- | :--------------------------------------------------------- |
| **Desktop Framework** | [Tauri v2](https://tauri.app/)                                                                 | Runtime nativo leve em Rust, seguro e com baixo footprint  |
| **Frontend**          | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)                 | Interface moderna, estrita e com componentes reativos      |
| **Build Tool**        | [Vite 7](https://vite.dev/)                                                                    | Bundler ultrarrápido com Hot Module Replacement            |
| **Backend Nativo**    | [Rust](https://www.rust-lang.org/) + [`whatsapp-rust`](https://crates.io/crates/whatsapp-rust) | Cliente de WhatsApp puro Rust com protocolo Noise e Signal |
| **Estilização**       | [Tailwind CSS 4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)               | Sistema de design moderno, limpo e adaptável (Dark/Light)  |
| **Ícones**            | [Lucide (react-icons/lu)](https://react-icons.github.io/react-icons/)                          | Biblioteca de ícones vetoriais concisa e padronizada       |
| **Validação**         | [Zod v4](https://zod.dev/)                                                                     | Validação robusta de schemas em runtime                    |
| **Armazenamento**     | SQLite (`rusqlite`)                                                                            | Persistência local criptografada e de alta velocidade      |

---

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 20 ou superior)
- [Rust & Cargo](https://rustup.rs/) (versão estável mais recente)
- Dependências de compilação da plataforma C++ / Visual Studio Build Tools no Windows

### Instruções

1. **Instalar as dependências:**

    ```bash
    npm install
    ```

2. **Executar em modo de desenvolvimento (Tauri + Vite HMR):**

    ```bash
    npm run tauri dev
    ```

3. **Validação de tipos e build do frontend:**

    ```bash
    npm run build
    ```

4. **Formatação e lint:**

    ```bash
    npm run lint ; npm run format
    ```

5. **Gerar pacote instalador para produção:**
    ```bash
    npm run tauri build
    ```

---

## 📋 Roadmap (Tarefas Pendentes)

Lista de melhorias, integrações e novas funcionalidades planejadas para as próximas versões:

### 💬 Mensagens e Conversas

- [ ] **Notificações de Sistema no Chat:** Avisos contextuais na timeline (entradas/saídas, mudanças de assunto e permissões).
- [ ] **Edição e Exclusão Remota:** Edição de texto e exclusão de mensagens para todos.
- [ ] **Prévia de Links (OpenGraph):** Card rico com título, descrição e miniatura ao enviar links.
- [ ] **Enquetes Interativas:** Envio, visualização e contagem de votos em enquetes.
- [ ] **Canais de Transmissão:** Leitura e acompanhamento de atualizações em canais oficiais.
- [ ] **Recebimento de Reações Remotas:** Atualização em tempo real de reações enviadas por terceiros.

### 👥 Gestão de Grupos e Contatos

- [ ] **Formatação e Exibição Completa de Telefones nas Conversas:** Revisão detalhada da formatação internacional em todos os componentes de cabeçalho e mensagens.

### 🖼️ Mídias, Figurinhas e Documentos

- [ ] **Figurinhas Favoritas:** Sincronização e gerenciamento de stickers favoritos.
- [ ] **Criação de Figurinhas Animadas:** Criação a partir de vídeos curtos ou GIFs.

### 🔌 Integrações e APIs para Desenvolvedores

- [ ] **Servidor Local de REST API:** Servidor HTTP embutido e configurável para automações locais com o WhatsApp.
- [ ] **Autenticação Multi-Conta por API Key:** Tokens isolados por sessão para integração externa segura.

### 📢 Status e Atualizações

- [ ] **Visualização de Status:** Exibição de postagens temporárias de contatos.
- [ ] **Publicação de Status:** Criação e envio de novos status pelo aplicativo.

---

## 📜 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo `LICENSE` para obter mais detalhes.
