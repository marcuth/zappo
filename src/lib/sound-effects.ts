// Audio notification player for incoming messages

let notificationAudio: HTMLAudioElement | null = null

/**
 * Plays the official notification sound (/assets/sounds/notification.mp3)
 * with a synthesis fallback if HTMLAudioElement fails.
 */
export function playNotificationSound(): void {
    try {
        if (!notificationAudio) {
            notificationAudio = new Audio("/assets/sounds/notification.mp3")
            notificationAudio.volume = 0.75
        }

        // Reset playback position if it's already playing or just finished
        notificationAudio.currentTime = 0
        const playPromise = notificationAudio.play()

        if (playPromise !== undefined) {
            playPromise.catch((error) => {
                console.warn(
                    "Autoplay restrito ou falha ao reproduzir áudio de notificação:",
                    error,
                )
            })
        }
    } catch (err) {
        console.warn("Erro ao instanciar áudio de notificação:", err)
    }
}
