import {
    LuCheck,
    LuKey,
    LuPencil,
    LuPlus,
    LuQrCode,
    LuShieldAlert,
    LuTrash2,
    LuUsers,
    LuX,
} from "react-icons/lu"
import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { useAccount } from "../providers/account-provider"
import { Spinner } from "../ui/spinner"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"

interface AccountsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AccountsModal({ open, onOpenChange }: AccountsModalProps) {
    const {
        accounts,
        activeAccount,
        switchAccount,
        createAccount,
        renameAccount,
        deleteAccount,
        qrData,
        pairingCode,
        requestPairingCode,
    } = useAccount()

    const [isCreating, setIsCreating] = useState(false)
    const [newAccountName, setNewAccountName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [createdAccId, setCreatedAccId] = useState<string | null>(null)
    const [editingAccountId, setEditingAccountId] = useState<string | null>(
        null,
    )
    const [editingAccountName, setEditingAccountName] = useState("")

    // Fecha o modal automaticamente após a conexão com o WhatsApp
    useEffect(() => {
        if (
            open &&
            activeAccount?.status === "connected" &&
            (isCreating || createdAccId)
        ) {
            const timer = setTimeout(() => {
                setIsCreating(false)
                setCreatedAccId(null)
                onOpenChange(false)
            }, 800)
            return () => clearTimeout(timer)
        }
    }, [activeAccount?.status, open, isCreating, createdAccId, onOpenChange])

    const handleCreate = async () => {
        if (!newAccountName.trim()) return
        const created = await createAccount(newAccountName, phoneNumber)
        setCreatedAccId(created.id)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <LuUsers className="h-5 w-5 text-primary" />
                        <span>Gerenciador de Múltiplas Contas</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Cadastre e alterne entre suas contas pessoais e de
                        trabalho.
                    </DialogDescription>
                </DialogHeader>

                {/* Requirement notice: Only active account receives messages */}
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground flex items-start gap-2.5">
                    <LuShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                        <strong className="text-primary font-semibold">
                            Isolamento de Contas Ativo:{" "}
                        </strong>
                        Por segurança e máxima economia de recursos (RAM e
                        bateria), <strong>apenas a conta ativa</strong> mantém
                        conexão e recebe mensagens na rede. As demais contas
                        permanecem seguras em espera.
                    </p>
                </div>

                {/* Accounts List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Suas Contas ({accounts.length})
                        </h4>
                        {!isCreating && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={() => setIsCreating(true)}
                            >
                                <LuPlus className="h-3.5 w-3.5" />
                                <span>Adicionar Conta</span>
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {accounts.map((acc) => {
                            const isActive = activeAccount?.id === acc.id

                            return (
                                <div
                                    key={acc.id}
                                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                        isActive
                                            ? "bg-primary/10 border-primary/40 shadow-xs"
                                            : "bg-card/60 border-border hover:bg-muted/40"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                                isActive
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                            }`}
                                        >
                                            {acc.name.slice(0, 2).toUpperCase()}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            {editingAccountId === acc.id ? (
                                                <div className="flex items-center gap-1.5 py-0.5">
                                                    <Input
                                                        value={
                                                            editingAccountName
                                                        }
                                                        onChange={(e) =>
                                                            setEditingAccountName(
                                                                e.target.value,
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                    "Enter" &&
                                                                editingAccountName.trim()
                                                            ) {
                                                                renameAccount(
                                                                    acc.id,
                                                                    editingAccountName.trim(),
                                                                )
                                                                setEditingAccountId(
                                                                    null,
                                                                )
                                                            } else if (
                                                                e.key ===
                                                                "Escape"
                                                            ) {
                                                                setEditingAccountId(
                                                                    null,
                                                                )
                                                            }
                                                        }}
                                                        placeholder="Novo nome da conta..."
                                                        className="h-7 text-xs w-48 bg-background"
                                                        autoFocus
                                                    />
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                        onClick={() => {
                                                            if (
                                                                editingAccountName.trim()
                                                            ) {
                                                                renameAccount(
                                                                    acc.id,
                                                                    editingAccountName.trim(),
                                                                )
                                                                setEditingAccountId(
                                                                    null,
                                                                )
                                                            }
                                                        }}
                                                        title="Salvar nome"
                                                    >
                                                        <LuCheck className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                        onClick={() =>
                                                            setEditingAccountId(
                                                                null,
                                                            )
                                                        }
                                                        title="Cancelar"
                                                    >
                                                        <LuX className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <h5 className="text-xs font-semibold text-foreground truncate">
                                                        {acc.name}
                                                    </h5>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingAccountId(
                                                                acc.id,
                                                            )
                                                            setEditingAccountName(
                                                                acc.name,
                                                            )
                                                        }}
                                                        className="text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer p-0.5 rounded"
                                                        title="Renomear conta"
                                                    >
                                                        <LuPencil className="h-3 w-3" />
                                                    </button>
                                                    {isActive &&
                                                        acc.status ===
                                                            "connected" && (
                                                            <Badge className="h-4 text-[10px] px-1.5 bg-emerald-500 text-white font-medium border-none">
                                                                Ativa •
                                                                Recebendo
                                                            </Badge>
                                                        )}
                                                    {isActive &&
                                                        acc.status !==
                                                            "connected" && (
                                                            <Badge className="h-4 text-[10px] px-1.5 bg-amber-500/20 text-amber-500 font-medium border border-amber-500/30">
                                                                Aguardando QR
                                                                Code
                                                            </Badge>
                                                        )}
                                                    {!isActive && (
                                                        <Badge
                                                            variant="outline"
                                                            className="h-4 text-[10px] px-1.5 text-muted-foreground"
                                                        >
                                                            Em Espera
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                            <p className="text-[11px] text-muted-foreground truncate">
                                                {acc.phone ||
                                                    acc.pushName ||
                                                    "Não pareado"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {!isActive ? (
                                            <Button
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() =>
                                                    switchAccount(acc.id)
                                                }
                                            >
                                                Ativar Esta Conta
                                            </Button>
                                        ) : acc.status === "connected" ? (
                                            <span className="text-[11px] text-emerald-500 font-medium px-2 flex items-center gap-1">
                                                <LuCheck className="h-3.5 w-3.5" />
                                                Conectada
                                            </span>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs border-amber-500/40 text-amber-500 hover:bg-amber-500/10 gap-1"
                                                onClick={() => {
                                                    setIsCreating(true)
                                                    setCreatedAccId(acc.id)
                                                }}
                                            >
                                                <LuQrCode className="h-3.5 w-3.5" />
                                                <span>Escanear QR</span>
                                            </Button>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                                deleteAccount(acc.id)
                                            }
                                            title="Remover conta"
                                        >
                                            <LuTrash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Add New Account Flow */}
                {isCreating && (
                    <div className="mt-4 p-4 rounded-xl border border-primary/30 bg-muted/30 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <LuPlus className="h-4 w-4 text-primary" />
                                <span>Conectar Nova Conta</span>
                            </h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-muted-foreground"
                                onClick={() => {
                                    setIsCreating(false)
                                    setCreatedAccId(null)
                                }}
                            >
                                Cancelar
                            </Button>
                        </div>

                        {!createdAccId ? (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-foreground">
                                        Nome da Conta:
                                    </label>
                                    <Input
                                        placeholder="Ex: Trabalho, Pessoal, Atendimento..."
                                        value={newAccountName}
                                        onChange={(e) =>
                                            setNewAccountName(e.target.value)
                                        }
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-foreground">
                                        Número de Telefone (opcional):
                                    </label>
                                    <Input
                                        placeholder="+55 11 99999-9999"
                                        value={phoneNumber}
                                        onChange={(e) =>
                                            setPhoneNumber(e.target.value)
                                        }
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <Button
                                    size="sm"
                                    className="w-full h-8 text-xs font-medium"
                                    onClick={handleCreate}
                                    disabled={!newAccountName.trim()}
                                >
                                    Criar e Gerar Conexão
                                </Button>
                            </div>
                        ) : (
                            /* Pairing Mode */
                            <Tabs defaultValue="qr" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-8">
                                    <TabsTrigger value="qr" className="text-xs">
                                        <LuQrCode className="h-3.5 w-3.5 mr-1.5" />
                                        QR Code
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="code"
                                        className="text-xs"
                                    >
                                        <LuKey className="h-3.5 w-3.5 mr-1.5" />
                                        Código de Pareamento
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent
                                    value="qr"
                                    className="space-y-3 pt-3"
                                >
                                    <div className="p-4 rounded-xl bg-card border border-border flex flex-col items-center justify-center space-y-4">
                                        {activeAccount?.status ===
                                        "connected" ? (
                                            <div className="w-56 h-56 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center p-4 text-center gap-3 animate-in fade-in zoom-in-95">
                                                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                                                    <LuCheck className="h-6 w-6 stroke-[3]" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-emerald-500">
                                                        Conectado com sucesso!
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Fechando em instantes...
                                                    </p>
                                                </div>
                                            </div>
                                        ) : qrData ? (
                                            <div className="w-56 h-56 rounded-2xl bg-white p-3.5 flex flex-col items-center justify-center shadow-lg border border-slate-200">
                                                <QRCodeSVG
                                                    value={qrData}
                                                    size={196}
                                                    level="M"
                                                    marginSize={1}
                                                    imageSettings={{
                                                        src: "/logo.svg",
                                                        x: undefined,
                                                        y: undefined,
                                                        height: 38,
                                                        width: 38,
                                                        excavate: true,
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-56 h-56 rounded-2xl bg-muted/40 border-2 border-dashed border-border flex flex-col items-center justify-center p-4 text-center gap-3">
                                                <Spinner className="h-8 w-8 text-primary" />
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-foreground">
                                                        Gerando QR Code do
                                                        WhatsApp...
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        Conectando ao servidor
                                                        seguro
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="text-center space-y-1 max-w-xs">
                                            <p className="text-xs font-semibold text-foreground">
                                                Escaneie o código com seu
                                                WhatsApp
                                            </p>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                1. Abra o WhatsApp no smartphone
                                                <br />
                                                2. Vá em{" "}
                                                <strong>
                                                    Aparelhos conectados
                                                </strong>{" "}
                                                &gt;{" "}
                                                <strong>
                                                    Conectar aparelho
                                                </strong>
                                                <br />
                                                3. Aponte a câmera para a tela
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent
                                    value="code"
                                    className="space-y-3 pt-3"
                                >
                                    <div className="p-4 rounded-xl bg-card border border-border text-center space-y-3">
                                        {activeAccount?.status ===
                                        "connected" ? (
                                            <div className="py-4 flex flex-col items-center justify-center gap-2 text-center animate-in fade-in">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                                                    <LuCheck className="h-5 w-5 stroke-[3]" />
                                                </div>
                                                <p className="text-sm font-semibold text-emerald-500">
                                                    Aparelho vinculado com
                                                    sucesso!
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Fechando em instantes...
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-xs text-muted-foreground">
                                                    Vincular com código de 8
                                                    dígitos no seu celular:
                                                </p>

                                                {pairingCode ? (
                                                    <div className="py-2.5 px-4 rounded-xl bg-primary/10 border border-primary/30 font-mono text-xl font-bold tracking-widest text-primary inline-block">
                                                        {pairingCode}
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs"
                                                        onClick={() =>
                                                            requestPairingCode(
                                                                phoneNumber ||
                                                                    "+5511999999999",
                                                            )
                                                        }
                                                    >
                                                        Gerar Código de
                                                        Pareamento
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
