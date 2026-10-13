import { LuPlus, LuSearch, LuSmile, LuSticker, LuX } from "react-icons/lu"
import { convertFileSrc } from "@tauri-apps/api/core"
import { useRef, useState, useMemo } from "react"

import { useAccount } from "../providers/account-provider"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

interface EmojiStickerPickerProps {
    open: boolean
    onClose: () => void
    onSelectEmoji: (emoji: string) => void
    onSendStickerFile: (file: File) => void
}

const EMOJI_CATEGORIES = [
    {
        name: "Carinhas & Emoções",
        emojis: [
            "😀",
            "😃",
            "😄",
            "😁",
            "😆",
            "😅",
            "🤣",
            "😂",
            "🙂",
            "🙃",
            "😉",
            "😊",
            "😇",
            "🥰",
            "😍",
            "🤩",
            "😘",
            "😗",
            "😚",
            "😋",
            "😛",
            "😜",
            "🤪",
            "😝",
            "🤗",
            "🤫",
            "🤔",
            "🤐",
            "🤨",
            "😐",
            "😑",
            "😶",
            "😏",
            "😒",
            "🙄",
            "😬",
            "🤥",
            "😌",
            "😔",
            "😪",
            "🤤",
            "😴",
            "😷",
            "🤒",
            "🤕",
            "🤢",
            "🤮",
            "🤧",
            "🥵",
            "🥶",
            "🥴",
            "😵",
            "🤯",
            "🤠",
            "🥳",
            "😎",
            "🤓",
            "🧐",
            "🥺",
            "😳",
        ],
    },
    {
        name: "Gestos & Mãos",
        emojis: [
            "👍",
            "👎",
            "👊",
            "✊",
            "🤛",
            "🤜",
            "🤞",
            "✌️",
            "🤟",
            "🤘",
            "👌",
            "🤌",
            "🤏",
            "👈",
            "👉",
            "👆",
            "👇",
            "☝️",
            "✋",
            "🤚",
            "🖐️",
            "🖖",
            "👋",
            "🤙",
            "💪",
            "🙏",
            "👏",
            "🤝",
            "✍️",
            "🤳",
        ],
    },
    {
        name: "Corações & Reações",
        emojis: [
            "❤️",
            "🧡",
            "💛",
            "💚",
            "💙",
            "💜",
            "🖤",
            "🤍",
            "🤎",
            "💔",
            "❣️",
            "💕",
            "💞",
            "💓",
            "💗",
            "💖",
            "💘",
            "💝",
            "🔥",
            "✨",
            "🌟",
            "💥",
            "💯",
            "🎉",
            "🚀",
            "👀",
            "💀",
            "🤡",
            "👻",
            "💩",
        ],
    },
    {
        name: "Objetos & Símbolos",
        emojis: [
            "☕",
            "🍺",
            "🍻",
            "🍕",
            "🍔",
            "🎯",
            "🏆",
            "🎮",
            "🎵",
            "🎧",
            "💡",
            "⚡",
            "⭐",
            "🌈",
            "☀️",
            "🌙",
            "👑",
            "💎",
            "💰",
            "💸",
            "📱",
            "💻",
            "⌨️",
            "📷",
            "🔒",
            "🔑",
            "📌",
            "📍",
            "⏰",
            "⏳",
        ],
    },
    {
        name: "Animais & Natureza",
        emojis: [
            "🐶",
            "🐱",
            "🐭",
            "🐹",
            "🐰",
            "🦊",
            "🐻",
            "🐼",
            "🐨",
            "🐯",
            "🦁",
            "🐮",
            "🐷",
            "🐸",
            "🐵",
            "🙈",
            "🙉",
            "🙊",
            "🐔",
            "🐧",
            "🐦",
            "🦅",
            "🦆",
            "🦉",
            "🦚",
            "🦜",
            "🐸",
            "🐊",
            "🐢",
            "🦎",
            "🐍",
            "🦕",
            "🦖",
            "🐙",
            "🦑",
            "🦈",
            "🐬",
            "🐳",
            "🐋",
            "🦋",
            "🐌",
            "🐛",
            "🐜",
            "🐝",
            "🪲",
            "🌸",
            "🌺",
            "🌻",
            "🌹",
            "🌷",
            "🍀",
            "🌿",
            "🌱",
            "🌲",
            "🌳",
            "🌵",
            "🍃",
            "🍂",
            "🍁",
        ],
    },
    {
        name: "Comidas & Bebidas",
        emojis: [
            "🍎",
            "🍊",
            "🍋",
            "🍇",
            "🍓",
            "🍒",
            "🍑",
            "🍍",
            "🥭",
            "🍌",
            "🍉",
            "🍈",
            "🍐",
            "🥝",
            "🍅",
            "🥑",
            "🫐",
            "🥦",
            "🌽",
            "🌶️",
            "🥕",
            "🧅",
            "🥔",
            "🍠",
            "🧄",
            "🫚",
            "🍳",
            "🥚",
            "🧀",
            "🥓",
            "🍗",
            "🍖",
            "🌮",
            "🌯",
            "🥙",
            "🥗",
            "🍜",
            "🍝",
            "🍛",
            "🍲",
            "🥘",
            "🍱",
            "🍣",
            "🍤",
            "🦐",
            "🦞",
            "🦀",
            "🦑",
            "🍩",
            "🍪",
            "🎂",
            "🍰",
            "🧁",
            "🍫",
            "🍬",
            "🍭",
            "🍦",
            "🧊",
            "🍵",
            "🧃",
            "🧉",
            "🥤",
            "🍷",
            "🥂",
            "🍾",
        ],
    },
    {
        name: "Atividades & Esportes",
        emojis: [
            "⚽",
            "🏀",
            "🏈",
            "⚾",
            "🎾",
            "🏐",
            "🏉",
            "🥏",
            "🎱",
            "🏓",
            "🏸",
            "🏒",
            "🥊",
            "🥋",
            "🥅",
            "⛳",
            "🎣",
            "🤿",
            "🎿",
            "🛷",
            "🏆",
            "🥇",
            "🥈",
            "🥉",
            "🏅",
            "🎖️",
            "🏋️",
            "🤸",
            "🧘",
            "🏄",
            "🚴",
            "🤾",
            "⛷️",
            "🏊",
            "🧗",
            "🏇",
            "🤺",
            "🥌",
            "🎯",
            "🎳",
            "🎰",
            "🎲",
            "🧩",
            "🪀",
            "🪁",
            "🎭",
            "🎨",
            "🖼️",
            "🎪",
            "🎠",
        ],
    },
    {
        name: "Viagens & Lugares",
        emojis: [
            "🚗",
            "🚕",
            "🚙",
            "🚌",
            "🚎",
            "🏎️",
            "🚓",
            "🚑",
            "🚒",
            "🚚",
            "✈️",
            "🛩️",
            "🚀",
            "🛸",
            "🚁",
            "⛵",
            "🚢",
            "🛥️",
            "🚂",
            "🚃",
            "🚇",
            "🚆",
            "🏠",
            "🏡",
            "🏢",
            "🏣",
            "🏥",
            "🏦",
            "🏨",
            "🏩",
            "💒",
            "🏛️",
            "⛪",
            "🕌",
            "🕍",
            "🗼",
            "🗽",
            "⛽",
            "🚦",
            "🗺️",
            "🌍",
            "🌎",
            "🌏",
            "🌐",
            "🏔️",
            "⛰️",
            "🌋",
            "🏖️",
            "🏕️",
            "🌅",
            "🌄",
        ],
    },
    {
        name: "Símbolos & Sinais",
        emojis: [
            "❤️",
            "🧡",
            "💛",
            "💚",
            "💙",
            "💜",
            "🖤",
            "🤍",
            "♠️",
            "♥️",
            "♦️",
            "♣️",
            "♟️",
            "✅",
            "❎",
            "✔️",
            "❌",
            "⭕",
            "🔴",
            "🟠",
            "🟡",
            "🟢",
            "🔵",
            "🟣",
            "⚫",
            "⚪",
            "🟤",
            "🔶",
            "🔷",
            "🔸",
            "🔹",
            "🔺",
            "🔻",
            "💠",
            "🔘",
            "🔲",
            "🔳",
            "▶️",
            "⏩",
            "⏭️",
            "⏮️",
            "⏫",
            "⏬",
            "⏪",
            "🔼",
            "🔽",
            "🔃",
            "🔄",
            "➡️",
            "⬅️",
            "⬆️",
            "⬇️",
            "↕️",
            "↔️",
            "↩️",
            "↪️",
            "🔁",
            "🔂",
            "#️⃣",
            "*️⃣",
            "0️⃣",
            "1️⃣",
            "2️⃣",
            "3️⃣",
            "🆎",
            "🆑",
            "🆒",
            "🆓",
            "🆕",
            "🆙",
            "🆚",
            "🈵",
            "🈴",
            "🈺",
            "🉐",
            "🈶",
            "💯",
            "🔔",
            "🔕",
            "🔇",
            "📢",
            "📣",
            "🔊",
            "⚠️",
            "🚫",
            "🚩",
            "🏳️",
            "🏴",
            "🏁",
            "🎌",
        ],
    },
]


const EMOJI_KEYWORDS: Record<string, string[]> = {
    // Carinhas & Emoções
    "😀": ["sorriso", "feliz", "alegre", "smile", "happy", "grinning"],
    "😃": ["sorriso", "feliz", "olhos abertos", "alegria", "happy"],
    "😄": ["sorriso", "contente", "alegre", "risada", "laugh"],
    "😁": ["sorridente", "dentes", "radiante", "grin"],
    "😆": ["gargalhada", "risada", "fechado", "rir", "lol"],
    "😅": ["suor", "alívio", "nervoso", "sorriso com suor", "sweat"],
    "🤣": ["rolando de rir", "gargalhada", "rofl", "rir", "engraçado"],
    "😂": ["chorando de rir", "lagrimas", "risos", "joy", "lol", "crying"],
    "🙂": ["sorriso leve", "simpático", "ok", "calmo"],
    "🙃": ["de cabeça para baixo", "ironia", "sarcasmo", "upside"],
    "😉": ["piscadela", "piscar", "brincadeira", "wink"],
    "😊": ["envergonhado", "sorriso fofo", "timido", "blush"],
    "😇": ["anjo", "inocente", "santo", "aureola", "angel"],
    "🥰": ["apaixonado", "amor", "corações", "love", "fofo"],
    "😍": ["olhos de coração", "amor", "apaixonado", "lindo", "love"],
    "🤩": ["estrelas nos olhos", "fascinado", "famoso", "star"],
    "😘": ["beijo", "coração", "carinho", "kiss"],
    "😗": ["beijinho", "bico", "assobio"],
    "😚": ["beijo com olhos fechados", "carinho"],
    "😋": ["delícia", "gostoso", "comida", "língua", "yum"],
    "😛": ["língua", "brincadeira", "tongue"],
    "😜": ["língua piscando", "doido", "brincando"],
    "🤪": ["maluco", "louco", "doido", "zany", "crazy"],
    "😝": ["língua olhos fechados", "careta"],
    "🤗": ["abraço", "carinho", "acolhimento", "hug"],
    "🤫": ["silêncio", "segredo", "shh", "quiet"],
    "🤔": ["pensando", "dúvida", "pensativo", "think"],
    "🤐": ["boca fechada", "zíper", "segredo", "silêncio"],
    "🤨": ["sobrancelha levantada", "desconfiado", "suspeito"],
    "😐": ["neutro", "sem expressão", "sério"],
    "😑": ["inexpressivo", "cansado", "saco cheio"],
    "😶": ["sem boca", "mudo", "sem palavras"],
    "😏": ["sorriso malicioso", "safado", "convencido", "smirk"],
    "😒": ["desanimado", "chateado", "revirando olhos", "unimpressed"],
    "🙄": ["revirar olhos", "tédio", "aff", "roll eyes"],
    "😬": ["careta", "nervoso", "climão", "tenso", "grimace"],
    "🤥": ["mentiroso", "pinóquio", "mentira", "lying"],
    "😌": ["aliviado", "paz", "tranquilo", "calmo"],
    "😔": ["triste", "pensativo", "desanimado", "sad"],
    "😪": ["sonolento", "gota", "sono", "sleepy"],
    "🤤": ["babando", "vontade", "delícia", "drool"],
    "😴": ["dormindo", "sono", "zzz", "sleep"],
    "😷": ["máscara", "doente", "covid", "hospital"],
    "🤒": ["termômetro", "febre", "doente", "sick"],
    "🤕": ["machucado", "curativo", "dor", "head"],
    "🤢": ["enjoado", "nojo", "nausea"],
    "🤮": ["vomitando", "vômito", "nojo", "puke"],
    "🤧": ["espirro", "gripe", "resfriado", "sneeze"],
    "🥵": ["calor", "quente", "suando", "hot"],
    "🥶": ["frio", "gelado", "congelando", "cold"],
    "🥴": ["tonto", "bêbado", "embriagado", "woozy"],
    "😵": ["tonto", "desmaiado", "tontura", "dizzy"],
    "🤯": ["cabeça explodindo", "chocado", "mind blown"],
    "🤠": ["cowboy", "chapéu", "xerife"],
    "🥳": ["festa", "comemoração", "aniversário", "party"],
    "😎": ["óculos de sol", "descolado", "top", "estiloso", "cool"],
    "🤓": ["nerd", "estudioso", "óculos", "geek"],
    "🧐": ["monóculo", "analisando", "investigando"],
    "🥺": ["olhos pidões", "por favor", "implorando", "dó", "pleading"],
    "😳": ["envergonhado", "corado", "chocado", "flushed"],

    // Gestos & Mãos
    "👍": [
        "joinha",
        "positivo",
        "legal",
        "ok",
        "like",
        "thumbs up",
        "sim",
        "beleza",
    ],
    "👎": ["descurtida", "negativo", "ruim", "dislike", "não"],
    "👊": ["soco", "punho", "bro fist", "toque"],
    "✊": ["punho erguido", "força", "resistência"],
    "🤛": ["soco esquerda", "toca aqui"],
    "🤜": ["soco direita", "toca aqui"],
    "🤞": ["dedos cruzados", "sorte", "esperança", "fingers crossed"],
    "✌️": ["paz", "vitória", "dois", "peace"],
    "🤟": ["te amo", "amor", "rock"],
    "🤘": ["rock", "metal", "chifre", "guitarra"],
    "👌": ["ok", "perfeito", "ótimo", "certeza"],
    "🤌": ["mão italiana", "o que você quer", "ma che vuoi"],
    "🤏": ["pouco", "pequeno", "pitada", "quase"],
    "👈": ["apontar esquerda", "esquerda"],
    "👉": ["apontar direita", "direita"],
    "👆": ["apontar cima", "cima"],
    "👇": ["apontar baixo", "baixo"],
    "☝️": ["um", "atenção", "apontar"],
    "✋": ["mão levantada", "pare", "stop", "cinco"],
    "🤚": ["costas da mão", "alto"],
    "🖐️": ["mão aberta", "cinco", "dedos abertos"],
    "🖖": ["saudação vulcana", "spock", "star trek"],
    "👋": ["tchau", "olá", "oi", "aceno", "wave"],
    "🤙": ["hang loose", "liga pra mim", "tranquilo", "shaka"],
    "💪": ["músculo", "força", "forte", "academia", "treino", "strong"],
    "🙏": [
        "oração",
        "rezar",
        "por favor",
        "amém",
        "obrigado",
        "gratidão",
        "pray",
    ],
    "👏": ["palmas", "aplausos", "parabéns", "bravo", "clap"],
    "🤝": ["aperto de mão", "acordo", "fechado", "negócio", "handshake"],
    "✍️": ["escrevendo", "escrever", "caneta", "anotando"],
    "🤳": ["selfie", "foto", "celular"],

    // Corações & Reações
    "❤️": ["coração vermelho", "amor", "paixão", "love", "heart", "coracao"],
    "🧡": ["coração laranja", "amor"],
    "💛": ["coração amarelo", "amizade"],
    "💚": ["coração verde", "esperança"],
    "💙": ["coração azul", "confiança"],
    "💜": ["coração roxo"],
    "🖤": ["coração preto", "luto", "black"],
    "🤍": ["coração branco", "paz"],
    "🤎": ["coração marrom"],
    "💔": ["coração partido", "fim", "tristeza", "bad"],
    "❣️": ["exclamação de coração", "amor"],
    "💕": ["dois corações", "amor"],
    "💞": ["corações girando"],
    "💓": ["coração batendo"],
    "💗": ["coração crescendo"],
    "💖": ["coração brilhante", "brilho"],
    "💘": ["coração com flecha", "cupido"],
    "💝": ["coração com laço", "presente"],
    "🔥": ["fogo", "chama", "quente", "hype", "brabo", "top", "fire", "chamas"],
    "✨": ["brilho", "estrelas", "mágico", "sparkles"],
    "🌟": ["estrela brilhante", "destaque"],
    "💥": ["explosão", "boom", "impacto"],
    "💯": ["cem", "cem por cento", "perfeito", "100"],
    "🎉": ["festa", "comemoração", "parabéns", "confete"],
    "🚀": ["foguete", "voar", "lua", "subindo", "rocket"],
    "👀": ["olhos", "olhando", "vendo", "atento", "fofoca", "eyes"],
    "💀": ["caveira", "morte", "morto de rir", "skull"],
    "🤡": ["palhaço", "palhaçada", "otário", "clown"],
    "👻": ["fantasma", "medo", "halloween", "ghost"],
    "💩": ["cocô", "merda", "bosta", "poop"],

    // Objetos & Símbolos
    "☕": ["café", "cafezinho", "bebida", "coffee"],
    "🍺": ["cerveja", "chopp", "bar", "beer"],
    "🍻": ["brinde", "cervejas", "comemoração", "cheers"],
    "🍕": ["pizza", "comida", "lanche"],
    "🍔": ["hambúrguer", "burguer", "fast food"],
    "🎯": ["alvo", "certeiro", "meta", "foco"],
    "🏆": ["troféu", "campeão", "vitória", "vencedor"],
    "🎮": ["videogame", "game", "jogo", "controle"],
    "🎵": ["música", "nota musical", "som"],
    "🎧": ["fone de ouvido", "música", "audio"],
    "💡": ["lâmpada", "ideia", "luz", "pensamento"],
    "⚡": ["raio", "energia", "elétrico", "rápido"],
    "⭐": ["estrela", "favorito", "star"],
    "🌈": ["arco-íris", "cores", "natureza"],
    "☀️": ["sol", "dia", "calor", "verão", "sun"],
    "🌙": ["lua", "noite", "dormir", "moon"],
    "👑": ["coroa", "rei", "rainha", "líder", "crown"],
    "💎": ["diamante", "joia", "precioso", "riqueza"],
    "💰": ["dinheiro", "saco de dinheiro", "grana", "money", "rico"],
    "💸": ["dinheiro voando", "gastos", "paguei"],
    "📱": ["celular", "telefone", "smartphone"],
    "💻": ["computador", "notebook", "laptop", "pc"],
    "⌨️": ["teclado", "digitar"],
    "📷": ["câmera", "foto", "fotografia"],
    "🔒": ["cadeado", "trancado", "segurança"],
    "🔑": ["chave", "acesso", "senha"],
    "📌": ["tachinha", "fixar", "pin"],
    "📍": ["alfinete", "localização", "mapa"],
    "⏰": ["despertador", "alarme", "hora", "tempo"],
    "⏳": ["ampulheta", "tempo", "espera"],

    // Animais & Natureza
    "🐶": ["cachorro", "cão", "dog", "pet", "animal"],
    "🐱": ["gato", "cat", "felino", "pet", "miau"],
    "🐭": ["rato", "mouse", "roedor"],
    "🐹": ["hamster", "ratinho", "fofo"],
    "🐰": ["coelho", "rabbit", "bunny", "fofo"],
    "🦊": ["raposa", "fox", "astuto"],
    "🐻": ["urso", "bear", "panda"],
    "🐼": ["panda", "urso panda", "china"],
    "🐨": ["coala", "koala", "australia"],
    "🐯": ["tigre", "tiger", "felino"],
    "🦁": ["leão", "lion", "rei", "animal"],
    "🐮": ["vaca", "cow", "fazenda"],
    "🐷": ["porco", "pig", "fazenda"],
    "🐸": ["sapo", "frog", "crocodilo"],
    "🐵": ["macaco", "monkey", "animal"],
    "🙈": ["não ver", "macaco tapando olhos"],
    "🙉": ["não ouvir", "macaco tapando ouvidos"],
    "🙊": ["não falar", "macaco tapando boca"],
    "🐔": ["galinha", "frango", "chicken", "fazenda"],
    "🐧": ["pinguim", "penguin", "inverno"],
    "🐦": ["pássaro", "bird", "voar"],
    "🦅": ["águia", "eagle", "ave"],
    "🦆": ["pato", "duck", "agua"],
    "🦉": ["coruja", "owl", "sábio", "noite"],
    "🦚": ["pavão", "peacock", "colorido"],
    "🦜": ["papagaio", "parrot", "falar", "colorido"],
    "🐊": ["crocodilo", "jacaré", "réptil"],
    "🐢": ["tartaruga", "turtle", "devagar", "lento"],
    "🦎": ["lagarto", "lizard", "réptil"],
    "🐍": ["cobra", "snake", "serpente"],
    "🦕": ["dinossauro", "dinosaur", "brachiosaurus"],
    "🦖": ["t-rex", "dinossauro", "tiranossauro"],
    "🐙": ["polvo", "octopus", "mar"],
    "🦑": ["lula", "squid", "mar"],
    "🦈": ["tubarão", "shark", "perigo", "mar"],
    "🐬": ["golfinho", "dolphin", "inteligente", "mar"],
    "🐳": ["baleia", "whale", "mar"],
    "🐋": ["baleia grande", "whale"],
    "🦋": ["borboleta", "butterfly", "transformação"],
    "🐌": ["caracol", "snail", "devagar", "lento"],
    "🐛": ["lagarta", "caterpillar", "inseto"],
    "🐜": ["formiga", "ant", "trabalho", "inseto"],
    "🐝": ["abelha", "bee", "mel", "inseto"],
    "🪲": ["besouro", "beetle", "inseto"],
    "🌸": ["flor de cerejeira", "sakura", "japão", "primavera"],
    "🌺": ["hibisco", "flor", "tropical"],
    "🌻": ["girassol", "sunflower", "amarelo"],
    "🌹": ["rosa", "rose", "amor", "flor"],
    "🌷": ["tulipa", "tulip", "flor"],
    "🍀": ["trevo da sorte", "four leaf clover", "sorte", "luck"],
    "🌿": ["erva", "herb", "natureza", "planta"],
    "🌱": ["muda", "seedling", "crescimento", "planta"],
    "🌲": ["pinheiro", "tree", "árvore", "natureza"],
    "🌳": ["árvore", "tree", "natureza", "parque"],
    "🌵": ["cacto", "cactus", "deserto", "seco"],
    "🍃": ["folha ao vento", "leaves", "natureza"],
    "🍂": ["folha de outono", "autumn leaf", "outono"],
    "🍁": ["folha de bordo", "maple leaf", "canadá", "outono"],

    // Comidas & Bebidas
    "🍎": ["maçã", "apple", "fruta", "vermelha"],
    "🍊": ["laranja", "orange", "fruta", "cítrico"],
    "🍋": ["limão", "lemon", "azedo", "fruta"],
    "🍇": ["uva", "grape", "fruta", "vinho"],
    "🍓": ["morango", "strawberry", "fruta", "vermelho"],
    "🍒": ["cereja", "cherry", "fruta"],
    "🍑": ["pêssego", "peach", "fruta"],
    "🍍": ["abacaxi", "pineapple", "tropical", "fruta"],
    "🥭": ["manga", "mango", "tropical", "fruta"],
    "🍌": ["banana", "fruta", "tropical"],
    "🍉": ["melancia", "watermelon", "fruta", "verão"],
    "🍈": ["melão", "melon", "fruta"],
    "🍐": ["pera", "pear", "fruta"],
    "🥝": ["kiwi", "kiwi fruit", "fruta", "verde"],
    "🍅": ["tomate", "tomato", "fruta", "legume"],
    "🥑": ["abacate", "avocado", "fruta", "verde"],
    "🫐": ["mirtilo", "blueberry", "fruta"],
    "🥦": ["brócolis", "broccoli", "legume", "saudável"],
    "🌽": ["milho", "corn", "legume", "amarelo"],
    "🌶️": ["pimenta", "chili pepper", "picante", "quente"],
    "🥕": ["cenoura", "carrot", "legume", "laranja"],
    "🧅": ["cebola", "onion", "legume"],
    "🥔": ["batata", "potato", "legume"],
    "🍠": ["batata doce", "sweet potato"],
    "🧄": ["alho", "garlic", "tempero"],
    "🍳": ["frigideira", "frying pan", "cozinhar", "ovo frito"],
    "🥚": ["ovo", "egg", "cozinha"],
    "🧀": ["queijo", "cheese", "amarelo"],
    "🥓": ["bacon", "presunto", "carne", "defumado"],
    "🍗": ["frango", "chicken leg", "comida"],
    "🍖": ["osso de carne", "meat", "churrasco"],
    "🌮": ["taco", "mexicano", "comida"],
    "🌯": ["wrap", "tortilha", "comida"],
    "🥙": ["pita", "wrap", "comida"],
    "🥗": ["salada", "salad", "saudável", "verde"],
    "🍜": ["ramen", "macarrão", "japonês", "sopa"],
    "🍝": ["macarrão", "spaghetti", "italiano", "massa"],
    "🍛": ["curry", "arroz", "indiano"],
    "🍲": ["panela", "ensopado", "sopa", "stew"],
    "🥘": ["paella", "arroz", "frutos do mar"],
    "🍱": ["bento", "japonês", "marmita"],
    "🍣": ["sushi", "japonês", "peixe"],
    "🍤": ["camarão frito", "tempurá"],
    "🦐": ["camarão", "shrimp", "frutos do mar"],
    "🦞": ["lagosta", "lobster", "frutos do mar"],
    "🦀": ["caranguejo", "crab", "frutos do mar"],
    "🍩": ["rosquinha", "donut", "sobremesa"],
    "🍪": ["biscoito", "cookie", "sobremesa"],
    "🎂": ["bolo de aniversário", "birthday cake", "parabéns"],
    "🍰": ["fatia de bolo", "cake", "sobremesa"],
    "🧁": ["cupcake", "bolinho", "sobremesa"],
    "🍫": ["chocolate", "doce", "sobremesa"],
    "🍬": ["bala", "candy", "doce"],
    "🍭": ["pirulito", "lollipop", "doce"],
    "🍦": ["sorvete", "ice cream", "sobremesa"],
    "🧊": ["gelo", "ice", "frio", "cubo"],
    "🍵": ["chá", "tea", "quente", "xícara"],
    "🧃": ["suco", "juice", "bebida", "caixinha"],
    "🧉": ["chimarrão", "erva-mate", "gaúcho", "mate"],
    "🥤": ["refrigerante", "bebida", "canudo", "soda"],
    "🍷": ["vinho", "wine", "tinto", "bebida"],
    "🥂": ["brinde", "champanhe", "celebração", "cheers"],
    "🍾": ["champanhe", "festa", "celebração", "espumante"],

    // Atividades & Esportes
    "⚽": ["futebol", "soccer", "bola", "esporte"],
    "🏀": ["basquete", "basketball", "esporte"],
    "🏈": ["futebol americano", "football", "esporte"],
    "⚾": ["beisebol", "baseball", "esporte"],
    "🎾": ["tênis", "tennis", "esporte"],
    "🏐": ["vôlei", "volleyball", "esporte"],
    "🏉": ["rugby", "esporte"],
    "🥏": ["frisbee", "disco", "esporte"],
    "🎱": ["sinuca", "bilhar", "billiards", "8 ball"],
    "🏓": ["ping pong", "tênis de mesa", "esporte"],
    "🏸": ["badminton", "peteca", "esporte"],
    "🏒": ["hóquei", "hockey", "gelo", "esporte"],
    "🥊": ["boxe", "boxing", "luta", "luva"],
    "🥋": ["jiu-jitsu", "karatê", "artes marciais", "kimono"],
    "🥅": ["gol", "rede", "futebol"],
    "⛳": ["golfe", "golf", "esporte"],
    "🎣": ["pesca", "pescaria", "fishing"],
    "🤿": ["mergulho", "diving", "snorkel"],
    "🎿": ["esqui", "ski", "neve", "inverno"],
    "🛷": ["trenó", "sled", "neve", "inverno"],
    "🥇": ["ouro", "gold", "medalha", "primeiro", "campeão"],
    "🥈": ["prata", "silver", "medalha", "segundo"],
    "🥉": ["bronze", "medalha", "terceiro"],
    "🏅": ["medalha", "medal", "esporte"],
    "🏋️": ["musculação", "academia", "haltere", "weight"],
    "🤸": ["ginástica", "acrobacia", "gymnastics"],
    "🧘": ["yoga", "meditação", "zen", "relaxar"],
    "🏄": ["surfe", "surf", "onda", "praia"],
    "🚴": ["ciclismo", "bicicleta", "cycling", "esporte"],
    "🤾": ["handebol", "handball", "esporte"],
    "⛷️": ["ski", "neve", "inverno", "montanha"],
    "🏊": ["natação", "nadar", "swimming", "piscina"],
    "🧗": ["escalada", "climbing", "montanha"],
    "🏇": ["hipismo", "equitação", "cavalo", "horse racing"],
    "🤺": ["esgrima", "fencing", "espada"],
    "🥌": ["curling", "esporte", "gelo"],
    "🎳": ["boliche", "bowling", "esporte"],
    "🎰": ["caça-níquel", "cassino", "slot machine"],
    "🎲": ["dado", "jogo", "sorte", "dice"],
    "🧩": ["puzzle", "quebra-cabeça", "peça"],
    "🪀": ["ioiô", "yoyo", "brinquedo"],
    "🪁": ["estilingue", "brinquedo"],
    "🎭": ["teatro", "drama", "máscara"],
    "🎨": ["arte", "pintura", "paleta", "criatividade"],
    "🖼️": ["quadro", "pintura", "arte", "frame"],
    "🎪": ["circo", "acrobacia", "show"],
    "🎠": ["carrossel", "parque", "diversão"],

    // Viagens & Lugares
    "🚗": ["carro", "car", "veículo", "dirigir"],
    "🚕": ["táxi", "taxi", "carro amarelo"],
    "🚙": ["SUV", "carro", "veículo"],
    "🚌": ["ônibus", "bus", "transporte", "coletivo"],
    "🚎": ["trólebus", "ônibus", "transporte"],
    "🏎️": ["carro de corrida", "formula 1", "velocidade"],
    "🚓": ["viatura", "policia", "police car"],
    "🚑": ["ambulância", "emergência", "saúde", "ambulance"],
    "🚒": ["caminhão de bombeiro", "fire truck", "emergência"],
    "🚚": ["caminhão", "truck", "entrega", "delivery"],
    "✈️": ["avião", "airplane", "voo", "viagem", "voar"],
    "🛩️": ["aviãozinho", "jato", "plane"],
    "🛸": ["nave espacial", "UFO", "extraterrestre", "disco voador"],
    "🚁": ["helicóptero", "helicopter", "voar"],
    "⛵": ["veleiro", "sailboat", "barco", "vela"],
    "🚢": ["navio", "ship", "cruzeiro", "barco"],
    "🛥️": ["lancha", "motorboat", "barco rápido"],
    "🚂": ["trem", "locomotiva", "train"],
    "🚃": ["vagão", "trem", "rail"],
    "🚇": ["metrô", "subway", "metro", "underground"],
    "🚆": ["trem bala", "bullet train", "veloz"],
    "🏠": ["casa", "house", "home", "lar"],
    "🏡": ["casa com jardim", "house", "suburban"],
    "🏢": ["prédio", "building", "escritório", "office"],
    "🏥": ["hospital", "médico", "saúde", "emergência"],
    "🏦": ["banco", "bank", "dinheiro", "financeiro"],
    "🏨": ["hotel", "hospedagem", "viagem"],
    "🏛️": ["templo", "museu", "histórico", "monument"],
    "🗼": ["torre eiffel", "paris", "frança", "eiffel tower"],
    "🗽": ["estátua da liberdade", "new york", "eua", "liberty"],
    "🗺️": ["mapa", "map", "mundo", "travel"],
    "🌍": ["terra europa/africa", "earth", "mundo", "globo"],
    "🌎": ["terra américas", "earth", "mundo", "globo"],
    "🌏": ["terra asia/oceania", "earth", "mundo", "globo"],
    "🌐": ["globo", "internet", "global", "web", "mundo"],
    "🏔️": ["montanha", "mountain", "neve", "pico"],
    "⛰️": ["montanha", "mountain", "trekking"],
    "🌋": ["vulcão", "volcano", "erupção"],
    "🏖️": ["praia", "beach", "verão", "mar"],
    "🏕️": ["acampamento", "camping", "barraca"],
    "🌅": ["pôr do sol", "amanhecer", "sunrise", "nascer do sol"],
    "🌄": ["amanhecer", "montanha", "sunrise", "natureza"],

    // Símbolos & Sinais
    "♠️": ["espada", "spade", "baralho", "carta"],
    "♥️": ["coração vermelho", "heart", "baralho"],
    "♦️": ["ouros", "diamond", "baralho"],
    "♣️": ["paus", "club", "trevo", "baralho"],
    "✅": ["ok", "aprovado", "correto", "check", "certo", "sim"],
    "❎": ["errado", "não", "cancelado"],
    "✔️": ["check", "certo", "aprovado", "correto"],
    "❌": ["x", "errado", "não", "cancelar", "fechar"],
    "⭕": ["circulo", "circle", "ok"],
    "🔴": ["círculo vermelho", "vermelho", "red", "alerta"],
    "🟠": ["círculo laranja", "laranja", "orange"],
    "🟡": ["círculo amarelo", "amarelo", "yellow"],
    "🟢": ["círculo verde", "verde", "green", "ok"],
    "🔵": ["círculo azul", "azul", "blue"],
    "🟣": ["círculo roxo", "roxo", "purple"],
    "⚫": ["círculo preto", "preto", "black"],
    "⚪": ["círculo branco", "branco", "white"],
    "🟤": ["círculo marrom", "marrom", "brown"],
    "🔶": ["diamante laranja", "losango", "laranja"],
    "🔷": ["diamante azul", "losango", "azul"],
    "🔔": ["sino", "notificação", "alerta", "bell", "notification"],
    "🔕": ["sino mudo", "silêncio", "sem notificação"],
    "🔇": ["mudo", "sem som", "silêncio", "mute"],
    "📢": ["megafone", "anúncio", "aviso", "alto-falante"],
    "📣": ["megafone", "torcida", "gritar"],
    "🔊": ["volume alto", "som", "audio", "alto"],
    "⚠️": ["atenção", "aviso", "perigo", "warning", "cuidado"],
    "🚫": ["proibido", "não", "bloqueado", "forbidden"],
    "🚩": ["bandeira vermelha", "red flag", "problema", "alerta"],
    "🏳️": ["bandeira branca", "paz", "rendição"],
    "🏴": ["bandeira preta", "pirata"],
    "🏁": ["bandeira quadriculada", "largada", "corrida", "fim"],
    "🎌": ["bandeiras cruzadas", "japão", "celebração"],
}

async function convertToStickerWebp(file: File): Promise<File> {
    return new Promise((resolve) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
            URL.revokeObjectURL(url)
            const canvas = document.createElement("canvas")
            canvas.width = 512
            canvas.height = 512
            const ctx = canvas.getContext("2d")
            if (!ctx) {
                resolve(file)
                return
            }
            const scale = Math.min(512 / img.width, 512 / img.height)
            const w = img.width * scale
            const h = img.height * scale
            const x = (512 - w) / 2
            const y = (512 - h) / 2
            ctx.clearRect(0, 0, 512, 512)
            ctx.drawImage(img, x, y, w, h)
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(
                            new File([blob], "sticker.webp", {
                                type: "image/webp",
                            }),
                        )
                    } else {
                        resolve(file)
                    }
                },
                "image/webp",
                0.9,
            )
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            resolve(file)
        }
        img.src = url
    })
}

export function EmojiStickerPicker({
    open,
    onClose,
    onSelectEmoji,
    onSendStickerFile,
}: EmojiStickerPickerProps) {
    const { messages, sendMedia, activeChat } = useAccount()
    const [activeTab, setActiveTab] = useState<"emojis" | "stickers">("emojis")
    const [searchQuery, setSearchQuery] = useState("")
    const stickerInputRef = useRef<HTMLInputElement>(null)

    // Extract recent downloaded stickers from chat history
    const recentStickers = useMemo(() => {
        const stickers: Array<{ id: string; localPath: string }> = []
        const seenPaths = new Set<string>()

        for (const msg of messages) {
            if (
                msg.media &&
                msg.media.mediaType === "sticker" &&
                msg.media.isDownloaded &&
                msg.media.localPath &&
                !seenPaths.has(msg.media.localPath)
            ) {
                seenPaths.add(msg.media.localPath)
                stickers.push({
                    id: msg.id,
                    localPath: msg.media.localPath,
                })
            }
        }

        return stickers
    }, [messages])

    if (!open) return null

    const handleStickerFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0]
        if (!file) return
        e.target.value = ""
        onClose()

        try {
            const webpFile = await convertToStickerWebp(file)
            onSendStickerFile(webpFile)
        } catch {
            onSendStickerFile(file)
        }
    }

    const handleSendRecentSticker = async (localPath: string) => {
        if (!activeChat) return
        try {
            // Read local file as blob via fetch Tauri asset URL
            const assetUrl = convertFileSrc(localPath)
            const res = await fetch(assetUrl)
            const blob = await res.blob()
            const file = new File([blob], "sticker.webp", {
                type: "image/webp",
            })
            await sendMedia(file, undefined, "sticker")
            onClose()
        } catch (error) {
            console.error("Erro ao reenviar figurinha:", error)
        }
    }

    return (
        <div className="absolute bottom-16 left-3 z-50 w-80 sm:w-96 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-96 select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Header with Tabs & Close button */}
            <div className="p-2.5 border-b border-border/60 flex items-center justify-between bg-muted/40">
                <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/40">
                    <button
                        type="button"
                        onClick={() => setActiveTab("emojis")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            activeTab === "emojis"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <LuSmile className="w-3.5 h-3.5 text-amber-500" />
                        <span>Emojis</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("stickers")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            activeTab === "stickers"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <LuSticker className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Figurinhas</span>
                    </button>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={onClose}
                >
                    <LuX className="w-4 h-4" />
                </Button>
            </div>

            {/* TAB 1: EMOJIS (COM NOTO COLOR EMOJI) */}
            {activeTab === "emojis" && (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="p-2 border-b border-border/40">
                        <div className="relative">
                            <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Filtrar emojis..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8 pl-8 text-xs bg-muted/50 border-0 focus-visible:ring-1"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
                        {EMOJI_CATEGORIES.map((cat) => {
                            const query = searchQuery.trim().toLowerCase()
                            const filtered = cat.emojis.filter((emoji) => {
                                if (!query) return true
                                if (emoji.includes(query)) return true
                                const keywords = EMOJI_KEYWORDS[emoji]
                                if (keywords) {
                                    return keywords.some((k) =>
                                        k.toLowerCase().includes(query),
                                    )
                                }
                                return cat.name.toLowerCase().includes(query)
                            })
                            if (filtered.length === 0) return null

                            return (
                                <div key={cat.name} className="space-y-1.5">
                                    <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        {cat.name}
                                    </h5>
                                    <div className="grid grid-cols-8 gap-1">
                                        {filtered.map((emoji, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() =>
                                                    onSelectEmoji(emoji)
                                                }
                                                className="w-9 h-9 rounded-lg hover:bg-muted/80 flex items-center justify-center text-xl font-emoji transition-transform hover:scale-125 active:scale-95"
                                                title={emoji}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: FIGURINHAS (STICKERS) */}
            {activeTab === "stickers" && (
                <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3">
                    <input
                        type="file"
                        ref={stickerInputRef}
                        onChange={handleStickerFileChange}
                        accept="image/webp,image/png,image/jpeg"
                        className="hidden"
                    />

                    <Button
                        variant="outline"
                        onClick={() => stickerInputRef.current?.click()}
                        className="w-full h-9 text-xs font-medium gap-2 border-dashed border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl"
                    >
                        <LuPlus className="w-4 h-4" />
                        Criar / Enviar Imagem como Figurinha
                    </Button>

                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Figurinhas desta conversa ({recentStickers.length})
                        </h5>

                        {recentStickers.length === 0 ? (
                            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                                <LuSticker className="w-8 h-8 mx-auto text-muted-foreground/40" />
                                <p>Nenhuma figurinha recente encontrada.</p>
                                <p className="text-[11px] text-muted-foreground/70">
                                    Envie qualquer imagem pelo botão acima para
                                    criar uma figurinha!
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {recentStickers.map((stk) => (
                                    <button
                                        key={stk.id}
                                        type="button"
                                        onClick={() =>
                                            handleSendRecentSticker(
                                                stk.localPath,
                                            )
                                        }
                                        className="w-18 h-18 p-1.5 rounded-xl border border-border/40 hover:border-emerald-500/50 hover:bg-muted/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group"
                                        title="Clique para enviar esta figurinha"
                                    >
                                        <img
                                            src={convertFileSrc(stk.localPath)}
                                            alt="Figurinha"
                                            className="w-full h-full object-contain"
                                            loading="lazy"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
