import {
    LuCpu,
    LuDownload,
    LuHardDrive,
    LuMoon,
    LuPalette,
    LuSettings,
    LuSun,
    LuZap,
} from "react-icons/lu"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { useAccount } from "../providers/account-provider"
import { useTheme } from "../providers/theme-provider"
import { Switch } from "../ui/switch"
import { Badge } from "../ui/badge"

interface SettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
    const { settings, updateSettings } = useAccount()
    const { theme, setTheme } = useTheme()

    const handleAutoDownloadChange = (
        key: keyof typeof settings.autoDownload,
        value: boolean | number,
    ) => {
        updateSettings({
            ...settings,
            autoDownload: {
                ...settings.autoDownload,
                [key]: value,
            },
        })
    }

    const handleToggle = (
        key:
            | "performanceMode"
            | "hardwareAcceleration"
            | "notifications"
            | "autoPurgeRevokedMessages",
        value: boolean,
    ) => {
        updateSettings({
            ...settings,
            [key]: value,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="shrink-0 pb-1">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <LuSettings className="h-5 w-5 text-primary" />
                        <span>Configurações</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Gerencie downloads de mídias, desempenho nativo e aparência.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="downloads" className="flex-1 flex flex-col min-h-0 mt-3">
                    <TabsList className="grid grid-cols-3 w-full shrink-0 h-9 p-1 bg-muted/70 rounded-xl">
                        <TabsTrigger
                            value="downloads"
                            className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                        >
                            <LuDownload className="h-3.5 w-3.5" />
                            <span>Downloads</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="performance"
                            className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                        >
                            <LuZap className="h-3.5 w-3.5" />
                            <span>Desempenho</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="appearance"
                            className="gap-1.5 text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                        >
                            <LuPalette className="h-3.5 w-3.5" />
                            <span>Aparência</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: DOWNLOAD SELETIVO */}
                    <TabsContent
                        value="downloads"
                        className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4 scrollbar-discrete focus-visible:outline-none"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-semibold text-foreground">
                                    Download Automático de Mídias
                                </h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Desative tipos que prefere baixar sob demanda para economizar disco e dados.
                                </p>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-[10px] text-primary border-primary/30 bg-primary/10 shrink-0"
                            >
                                Economia de Disco
                            </Badge>
                        </div>

                        <div className="divide-y divide-border/60 rounded-xl border border-border bg-card/60 overflow-hidden">
                            {/* Fotos */}
                            <div className="p-3 flex items-center justify-between gap-3">
                                <div>
                                    <h5 className="text-xs font-medium text-foreground">
                                        Fotos e Imagens
                                    </h5>
                                    <p className="text-[11px] text-muted-foreground">
                                        Baixar fotos automaticamente ao receber
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.autoDownload.images}
                                    onCheckedChange={(checked) =>
                                        handleAutoDownloadChange(
                                            "images",
                                            checked,
                                        )
                                    }
                                />
                            </div>

                            {/* Vídeos */}
                            <div className="p-3 flex items-center justify-between gap-3">
                                <div>
                                    <h5 className="text-xs font-medium text-foreground">
                                        Vídeos
                                    </h5>
                                    <p className="text-[11px] text-muted-foreground">
                                        Baixar clipes e vídeos automaticamente
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.autoDownload.videos}
                                    onCheckedChange={(checked) =>
                                        handleAutoDownloadChange(
                                            "videos",
                                            checked,
                                        )
                                    }
                                />
                            </div>

                            {/* Áudios */}
                            <div className="p-3 flex items-center justify-between gap-3">
                                <div>
                                    <h5 className="text-xs font-medium text-foreground">
                                        Áudios e Mensagens de Voz
                                    </h5>
                                    <p className="text-[11px] text-muted-foreground">
                                        Baixar notas de voz e faixas de áudio
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.autoDownload.audio}
                                    onCheckedChange={(checked) =>
                                        handleAutoDownloadChange(
                                            "audio",
                                            checked,
                                        )
                                    }
                                />
                            </div>

                            {/* Documentos */}
                            <div className="p-3 flex items-center justify-between gap-3">
                                <div>
                                    <h5 className="text-xs font-medium text-foreground">
                                        Documentos e Arquivos
                                    </h5>
                                    <p className="text-[11px] text-muted-foreground">
                                        Baixar PDFs, planilhas e arquivos anexados
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.autoDownload.documents}
                                    onCheckedChange={(checked) =>
                                        handleAutoDownloadChange(
                                            "documents",
                                            checked,
                                        )
                                    }
                                />
                            </div>

                            {/* Limite de tamanho */}
                            <div className="p-3 flex items-center justify-between gap-3">
                                <div>
                                    <h5 className="text-xs font-medium text-foreground">
                                        Limite Máximo por Arquivo
                                    </h5>
                                    <p className="text-[11px] text-muted-foreground">
                                        Não baixar mídias maiores que o limite especificado
                                    </p>
                                </div>
                                <select
                                    value={settings.autoDownload.maxFileSizeMb}
                                    onChange={(e) =>
                                        handleAutoDownloadChange(
                                            "maxFileSizeMb",
                                            Number(e.target.value),
                                        )
                                    }
                                    className="bg-muted border border-input text-xs rounded-lg px-2.5 py-1 text-foreground focus:outline-none"
                                >
                                    <option value={2}>Até 2 MB</option>
                                    <option value={5}>Até 5 MB</option>
                                    <option value={10}>Até 10 MB (Padrão)</option>
                                    <option value={25}>Até 25 MB</option>
                                    <option value={50}>Até 50 MB</option>
                                    <option value={0}>Sem limite</option>
                                </select>
                            </div>

                            {/* Somente no Wi-Fi */}
                            <div className="p-3 flex items-center justify-between gap-3">
                                <div>
                                    <h5 className="text-xs font-medium text-foreground">
                                        Apenas em Redes Wi-Fi
                                    </h5>
                                    <p className="text-[11px] text-muted-foreground">
                                        Evita consumo de planos de dados móveis / roteamento
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.autoDownload.autoDownloadOnWifi}
                                    onCheckedChange={(checked) =>
                                        handleAutoDownloadChange(
                                            "autoDownloadOnWifi",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 2: DESEMPENHO E LIMPEZA */}
                    <TabsContent
                        value="performance"
                        className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4 scrollbar-discrete focus-visible:outline-none"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-semibold text-foreground">
                                    Desempenho Nativo (Zero Lag)
                                </h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Otimizações de renderização, GPU e limpeza de armazenamento local.
                                </p>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10 shrink-0"
                            >
                                ~48 MB RAM
                            </Badge>
                        </div>

                        <div className="divide-y divide-border/60 rounded-xl border border-border bg-card/60 overflow-hidden">
                            <div className="p-3 flex items-center justify-between gap-3">
                                <div>
                                    <h5 className="text-xs font-medium text-foreground">
                                        Modo Alto Desempenho
                                    </h5>
                                    <p className="text-[11px] text-muted-foreground">
                                        Descarrega mídias inativas da memória RAM e prioriza 60fps constantes
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.performanceMode}
                                    onCheckedChange={(checked) =>
                                        handleToggle("performanceMode", checked)
                                    }
                                />
                            </div>

                            <div className="p-3 flex items-center justify-between gap-3">
                                <div>
                                    <h5 className="text-xs font-medium text-foreground">
                                        Aceleração por Hardware (GPU)
                                    </h5>
                                    <p className="text-[11px] text-muted-foreground">
                                        Renderização acelerada via GPU nativa do Windows (DirectX/WebView2)
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.hardwareAcceleration}
                                    onCheckedChange={(checked) =>
                                        handleToggle("hardwareAcceleration", checked)
                                    }
                                />
                            </div>

                            <div className="p-3 flex items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <LuHardDrive className="w-3.5 h-3.5 text-primary" />
                                        <h5 className="text-xs font-medium text-foreground">
                                            Purgar Mensagens Apagadas (SQLite e Cache)
                                        </h5>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Exclui permanentemente mensagens revogadas e limpa seus arquivos de mídia do disco local
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.autoPurgeRevokedMessages ?? true}
                                    onCheckedChange={(checked) =>
                                        handleToggle(
                                            "autoPurgeRevokedMessages",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 3: APARÊNCIA */}
                    <TabsContent
                        value="appearance"
                        className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4 scrollbar-discrete focus-visible:outline-none"
                    >
                        <div>
                            <h4 className="text-xs font-semibold text-foreground">
                                Tema da Interface
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Escolha o esquema visual do aplicativo para o seu ambiente de trabalho.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                            <button
                                type="button"
                                onClick={() => setTheme("dark")}
                                className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                                    theme === "dark"
                                        ? "bg-primary/15 border-primary text-primary shadow-xs"
                                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                }`}
                            >
                                <LuMoon className="h-5 w-5" />
                                <span>Escuro</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTheme("light")}
                                className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                                    theme === "light"
                                        ? "bg-primary/15 border-primary text-primary shadow-xs"
                                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                }`}
                            >
                                <LuSun className="h-5 w-5" />
                                <span>Claro</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTheme("system")}
                                className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                                    theme === "system"
                                        ? "bg-primary/15 border-primary text-primary shadow-xs"
                                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                }`}
                            >
                                <LuCpu className="h-5 w-5" />
                                <span>Sistema</span>
                            </button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
