import { LuCpu, LuDownload, LuMoon, LuSettings, LuSun } from "react-icons/lu"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog"
import { useAccount } from "../providers/account-provider"
import { useTheme } from "../providers/theme-provider"
import { Separator } from "../ui/separator"
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
        key: "performanceMode" | "hardwareAcceleration" | "notifications",
        value: boolean,
    ) => {
        updateSettings({
            ...settings,
            [key]: value,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <LuSettings className="h-5 w-5 text-primary" />
                        <span>Configurações & Download Seletivo</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Personalize o download automático de mídias e
                        otimizações de desempenho.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* SECTION 1: DOWNLOAD SELETIVO DE MÍDIAS */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <LuDownload className="h-4 w-4 text-primary" />
                                <h4 className="text-xs font-semibold text-foreground">
                                    Download Automático de Mídias
                                </h4>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-[10px] text-primary border-primary/30 bg-primary/10"
                            >
                                Economia de Disco
                            </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Desative os tipos que você NÃO deseja baixar
                            automaticamente. Quando desativado, o arquivo
                            exibirá um botão para baixar sob demanda quando você
                            desejar.
                        </p>

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
                                        Baixar PDFs, planilhas e arquivos
                                        anexados
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
                                        Não baixar mídias maiores que o limite
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
                                    <option value={10}>
                                        Até 10 MB (Padrão)
                                    </option>
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
                                        Evita consumo de dados móveis /
                                        roteamento
                                    </p>
                                </div>
                                <Switch
                                    checked={
                                        settings.autoDownload.autoDownloadOnWifi
                                    }
                                    onCheckedChange={(checked) =>
                                        handleAutoDownloadChange(
                                            "autoDownloadOnWifi",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* SECTION 2: ALTO DESEMPENHO & MEMÓRIA */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <LuCpu className="h-4 w-4 text-emerald-500" />
                                <h4 className="text-xs font-semibold text-foreground">
                                    Desempenho Nativo (Zero Lag)
                                </h4>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
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
                                        Descarrega mídias inativas da memória
                                        RAM e prioriza 60fps
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
                                        Renderização acelerada via GPU nativa do
                                        Windows
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.hardwareAcceleration}
                                    onCheckedChange={(checked) =>
                                        handleToggle(
                                            "hardwareAcceleration",
                                            checked,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* SECTION 3: APARÊNCIA & TEMA */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-foreground">
                            Aparência
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setTheme("dark")}
                                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                                    theme === "dark"
                                        ? "bg-primary/15 border-primary text-primary"
                                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/80"
                                }`}
                            >
                                <LuMoon className="h-4 w-4" />
                                <span>Escuro</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTheme("light")}
                                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                                    theme === "light"
                                        ? "bg-primary/15 border-primary text-primary"
                                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/80"
                                }`}
                            >
                                <LuSun className="h-4 w-4" />
                                <span>Claro</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTheme("system")}
                                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                                    theme === "system"
                                        ? "bg-primary/15 border-primary text-primary"
                                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/80"
                                }`}
                            >
                                <LuCpu className="h-4 w-4" />
                                <span>Sistema</span>
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
