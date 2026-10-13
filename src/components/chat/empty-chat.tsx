import { LuCpu, LuHardDrive, LuShieldCheck, LuUsers } from "react-icons/lu"

import { Badge } from "../ui/badge"

export function EmptyChat() {
    return (
        <section className="flex-1 flex flex-col items-center justify-center p-8 bg-background/50 select-none text-center">
            <div className="max-w-md space-y-6">
                {/* Logo & Emblem */}
                <div className="relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center p-3.5 shadow-lg shadow-primary/10">
                    <img
                        src="/logo.svg"
                        alt="Zappo Logo"
                        className="w-full h-full object-contain drop-shadow"
                    />
                    <div className="absolute -inset-1 rounded-3xl bg-primary/20 blur-xl -z-10" />
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight text-foreground">
                            Zappo Desktop
                        </h2>
                        <Badge
                            variant="outline"
                            className="text-xs bg-primary/10 text-primary border-primary/30"
                        >
                            High Performance
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Cliente WhatsApp ultrarrápido construído com{" "}
                        <span className="font-semibold text-primary">
                            whatsapp-rust
                        </span>{" "}
                        e Tauri v2. Desempenho nativo com baixo consumo de
                        memória.
                    </p>
                </div>

                {/* Feature highlights grid */}
                <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="p-3 rounded-xl bg-card/60 border border-border/80 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <LuCpu className="h-4 w-4 text-emerald-500" />
                            <span>Ultra Leve (~48MB)</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Zero Electron. WebView2 nativo e backend assíncrono
                            em Rust.
                        </p>
                    </div>

                    <div className="p-3 rounded-xl bg-card/60 border border-border/80 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <LuHardDrive className="h-4 w-4 text-blue-500" />
                            <span>Download Seletivo</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Escolha o que baixar sob demanda. Não congestione
                            seu disco.
                        </p>
                    </div>

                    <div className="p-3 rounded-xl bg-card/60 border border-border/80 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <LuUsers className="h-4 w-4 text-purple-500" />
                            <span>Múltiplas Contas</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Conecte várias contas. Apenas a conta ativa recebe
                            mensagens na rede.
                        </p>
                    </div>

                    <div className="p-3 rounded-xl bg-card/60 border border-border/80 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <LuShieldCheck className="h-4 w-4 text-amber-500" />
                            <span>Signal Protocol</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Criptografia de ponta a ponta (E2EE) auditada e
                            nativa.
                        </p>
                    </div>
                </div>

                <div className="pt-2 text-[11px] text-muted-foreground/70">
                    Selecione uma conversa na barra lateral para começar a
                    conversar.
                </div>
            </div>
        </section>
    )
}
