import { LuMic, LuPause, LuPlay } from "react-icons/lu"
import React, { useEffect, useRef, useState } from "react"

import { Button } from "../ui/button"

interface AudioPlayerCardProps {
    src: string
    isVoice?: boolean
    fileSize?: number
}

const PLAYBACK_SPEEDS = [1, 1.5, 2]

export function AudioPlayerCard({
    src,
    isVoice = false,
    fileSize,
}: AudioPlayerCardProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [speedIndex, setSpeedIndex] = useState(0)
    const [waveformHeights] = useState(() =>
        // Deterministic decorative waveform bars resembling WhatsApp voice note
        Array.from({ length: 28 }, (_, i) => {
            const pattern = [
                25, 40, 65, 90, 45, 30, 80, 100, 70, 50, 35, 85, 60, 40,
            ]
            return pattern[i % pattern.length]
        }),
    )

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
        const handleLoadedMetadata = () => {
            if (audio.duration && !isNaN(audio.duration)) {
                setDuration(audio.duration)
            }
        }
        const handleEnded = () => {
            setIsPlaying(false)
            setCurrentTime(0)
        }

        audio.addEventListener("timeupdate", handleTimeUpdate)
        audio.addEventListener("loadedmetadata", handleLoadedMetadata)
        audio.addEventListener("ended", handleEnded)

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate)
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
            audio.removeEventListener("ended", handleEnded)
        }
    }, [src])

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
            setIsPlaying(false)
        } else {
            audio.play().catch((err) => {
                console.error("Erro ao reproduzir áudio:", err)
            })
            setIsPlaying(true)
        }
    }

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current
        if (!audio || !duration) return

        const rect = e.currentTarget.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const percentage = Math.max(0, Math.min(1, clickX / rect.width))
        const newTime = percentage * duration
        audio.currentTime = newTime
        setCurrentTime(newTime)
    }

    const cycleSpeed = () => {
        const audio = audioRef.current
        const nextIndex = (speedIndex + 1) % PLAYBACK_SPEEDS.length
        setSpeedIndex(nextIndex)
        const nextSpeed = PLAYBACK_SPEEDS[nextIndex]
        if (audio) {
            audio.playbackRate = nextSpeed
        }
    }

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00"
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`
    }

    const formatBytes = (bytes?: number) => {
        if (!bytes || bytes === 0) return ""
        const k = 1024
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <div className="mt-1.5 p-3 rounded-2xl border border-border/60 bg-card/95 backdrop-blur shadow-sm max-w-sm w-72 sm:w-80 space-y-2.5">
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Header info */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                        <LuMic className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-foreground">
                        {isVoice ? "Mensagem de Voz" : "Arquivo de Áudio"}
                    </span>
                </div>
                {fileSize && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                        {formatBytes(fileSize)}
                    </span>
                )}
            </div>

            {/* Controls and waveform */}
            <div className="flex items-center gap-3">
                <Button
                    size="icon"
                    type="button"
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 shadow-sm transition-transform active:scale-95 cursor-pointer"
                    title={isPlaying ? "Pausar" : "Reproduzir"}
                >
                    {isPlaying ? (
                        <LuPause className="w-4 h-4 fill-current" />
                    ) : (
                        <LuPlay className="w-4 h-4 fill-current ml-0.5" />
                    )}
                </Button>

                {/* Interactive Waveform Progress */}
                <div
                    onClick={handleSeek}
                    className="flex-1 h-9 flex items-center gap-0.5 px-1 py-1 bg-muted/40 hover:bg-muted/70 rounded-xl cursor-pointer transition-colors relative group select-none"
                    title="Clique para navegar pelo áudio"
                >
                    {waveformHeights.map((h, index) => {
                        const barProgress =
                            (index / waveformHeights.length) * 100
                        const isPlayed = barProgress <= progress

                        return (
                            <div
                                key={index}
                                className="flex-1 flex items-center justify-center h-full"
                            >
                                <div
                                    style={{ height: `${h}%` }}
                                    className={`w-full max-w-[3px] rounded-full transition-colors ${
                                        isPlayed
                                            ? "bg-primary"
                                            : "bg-muted-foreground/30 group-hover:bg-muted-foreground/45"
                                    }`}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Time & speed indicator */}
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground px-1">
                <span>{formatTime(currentTime)}</span>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={cycleSpeed}
                        className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-bold text-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                        title="Alternar velocidade de reprodução"
                    >
                        {PLAYBACK_SPEEDS[speedIndex]}x
                    </button>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    )
}
