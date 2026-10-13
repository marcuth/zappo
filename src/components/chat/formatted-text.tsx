import { openUrl } from "@tauri-apps/plugin-opener"
import React, { ReactNode } from "react"

interface FormattedTextProps {
    text: string
    className?: string
}

// Regex patterns for WhatsApp Markdown & URLs
const URL_REGEX = /(https?:\/\/[^\s<>"'()]+|wa\.me\/[0-9+]+)/gi

/**
 * Handles safe external link opening via Tauri opener plugin
 */
async function handleLinkClick(e: React.MouseEvent, url: string) {
    e.preventDefault()
    e.stopPropagation()
    const finalUrl = url.startsWith("wa.me/") ? `https://${url}` : url
    try {
        await openUrl(finalUrl)
    } catch (err) {
        console.error("Falha ao abrir URL:", err)
        window.open(finalUrl, "_blank", "noopener,noreferrer")
    }
}

/**
 * Parses inner text for inline WhatsApp styles:
 * *bold*, _italic_, ~strike~, `inline code`, and clickable URLs
 */
function parseInline(content: string, keyPrefix: string): ReactNode[] {
    // Split into segments by URLs first
    const parts = content.split(URL_REGEX)

    return parts.flatMap((part, partIdx) => {
        if (!part) return []

        const isUrl = URL_REGEX.test(part)
        URL_REGEX.lastIndex = 0

        if (isUrl) {
            return (
                <a
                    key={`${keyPrefix}-url-${partIdx}`}
                    href={part}
                    onClick={(e) => handleLinkClick(e, part)}
                    className="underline underline-offset-2 font-medium hover:opacity-80 transition-opacity break-all cursor-pointer text-sky-400 dark:text-sky-300"
                    title={`Abrir ${part}`}
                >
                    {part}
                </a>
            )
        }

        // Tokenize WhatsApp inline formatting (*, _, ~, `)
        // Matches `code`, *bold*, _italic_, ~strike~
        const tokenRegex = /(`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g

        const inlineTokens = part.split(tokenRegex)

        return inlineTokens.map((token, tokenIdx) => {
            const tokenKey = `${keyPrefix}-t-${partIdx}-${tokenIdx}`

            if (
                token.startsWith("`") &&
                token.endsWith("`") &&
                token.length > 2
            ) {
                return (
                    <code
                        key={tokenKey}
                        className="px-1.5 py-0.5 rounded bg-black/20 text-amber-300 dark:text-amber-200 font-mono text-[11px]"
                    >
                        {token.slice(1, -1)}
                    </code>
                )
            }

            if (
                token.startsWith("*") &&
                token.endsWith("*") &&
                token.length > 2
            ) {
                return (
                    <strong key={tokenKey} className="font-bold">
                        {token.slice(1, -1)}
                    </strong>
                )
            }

            if (
                token.startsWith("_") &&
                token.endsWith("_") &&
                token.length > 2
            ) {
                return (
                    <em key={tokenKey} className="italic">
                        {token.slice(1, -1)}
                    </em>
                )
            }

            if (
                token.startsWith("~") &&
                token.endsWith("~") &&
                token.length > 2
            ) {
                return (
                    <del key={tokenKey} className="line-through opacity-85">
                        {token.slice(1, -1)}
                    </del>
                )
            }

            return <React.Fragment key={tokenKey}>{token}</React.Fragment>
        })
    })
}

/**
 * Formats WhatsApp text supporting:
 * - ```code blocks```
 * - `inline code`
 * - *bold*
 * - _italic_
 * - ~strikethrough~
 * - Clickable links (http, https, wa.me)
 */
export function FormattedText({ text, className = "" }: FormattedTextProps) {
    if (!text) return null

    // Split text by multiline code blocks ```...```
    const codeBlockRegex = /```([\s\S]*?)```/g
    const chunks = text.split(codeBlockRegex)

    return (
        <span
            className={`inline leading-relaxed break-words whitespace-pre-wrap ${className}`}
        >
            {chunks.map((chunk, index) => {
                // Odd indices are contents of ```...``` code blocks
                if (index % 2 === 1) {
                    return (
                        <pre
                            key={`block-${index}`}
                            className="my-1.5 p-2 rounded-lg bg-black/40 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre border border-white/10"
                        >
                            <code>{chunk}</code>
                        </pre>
                    )
                }

                // Even indices are regular text with inline tokens
                return (
                    <React.Fragment key={`text-${index}`}>
                        {parseInline(chunk, `chunk-${index}`)}
                    </React.Fragment>
                )
            })}
        </span>
    )
}
