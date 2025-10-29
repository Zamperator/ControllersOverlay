import React, { useEffect, useMemo, useState } from "react"
import {controllerSetups, getControllerSetup} from "../config/config"
import "../styles/MenuPanel.css"
import { L8N } from "../lib/Localization"
import ctrlConfig from "@/config/ctrlConfig";

// Helper: Regex-Input parsen und validieren
function parseRegexInput(input) {
    if (typeof input !== "string") {
        return { valid: false }
    }

    const s = input.trim()
    if (s === "") {
        // Leeres Feld erlaubt: löscht die Regex
        return { valid: true, source: "", flags: "" }
    }

    let source = s
    let flags = ""

    // /pattern/flags – Syntax unterstützen
    if (s.startsWith("/") && s.lastIndexOf("/") > 0) {
        const last = s.lastIndexOf("/")
        source = s.slice(1, last)
        flags = s.slice(last + 1)
    }

    try {
        // Testweise kompilieren
        new RegExp(source, flags)
        return { valid: true, source, flags }
    } catch (e) {
        return { valid: false, error: String(e && e.message ? e.message : e) }
    }
}

export default function MenuPanel({
                                      showDeviceSelect,
                                      setShowDeviceSelect,
                                      activeSetup,
                                      setActiveSetup,
                                      debug,
                                      setDebug,
                                      leftLinks = []
                                  }) {
    const [theme, setTheme] = useState("")
    const [visible, setVisible] = useState(false)
    const [pinned, setPinned] = useState(false)

    const cfg = getControllerSetup(activeSetup)

    // Darf das aktive Device Themes nutzen?
    const allowTheme = useMemo(() => {
        if (!activeSetup) {
            return false
        }
        return !!cfg?.themes
    }, [activeSetup, cfg])

    // === Initialisierung: URL > localStorage ===
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const urlTheme = params.get("theme")
        const storedTheme = localStorage.getItem("arcadeTheme")
        const storedPin = localStorage.getItem("arcadeMenuPinned")

        if (urlTheme) {
            setTheme(urlTheme)
        } else {
            if (storedTheme) {
                setTheme(storedTheme)
            }
        }

        if (storedPin === "true") {
            setPinned(true)
            setVisible(true)
        }
    }, [])

    // === Theme anwenden/speichern/URL sync (nur wenn erlaubt) ===
    useEffect(() => {
        if (!allowTheme) {
            if (theme) {
                setTheme("")
            }
            document.documentElement.removeAttribute("data-theme")

            const params = new URLSearchParams(window.location.search)
            params.delete("theme")
            const newUrl = `${window.location.pathname}?${params.toString()}`
            window.history.replaceState({}, "", newUrl)

            localStorage.removeItem("arcadeTheme")
            return
        }

        if (!theme) {
            document.documentElement.removeAttribute("data-theme")
            localStorage.removeItem("arcadeTheme")
        } else {
            document.documentElement.setAttribute("data-theme", theme)
            localStorage.setItem("arcadeTheme", theme)
        }

        const params = new URLSearchParams(window.location.search)
        if (theme) {
            params.set("theme", theme)
        } else {
            params.delete("theme")
        }
        const newUrl = `${window.location.pathname}?${params.toString()}`
        window.history.replaceState({}, "", newUrl)
    }, [theme, allowTheme])

    // === Debug-Zustand laden (Default: false) ===
    useEffect(() => {
        const storedDebug = localStorage.getItem("arcadeDebug")
        if (storedDebug === null) {
            setDebug(false)
            localStorage.setItem("arcadeDebug", "false")
        } else {
            const parsed = storedDebug === "true"
            setDebug(parsed)
        }
    }, [setDebug])

    function handleThemeChange(event) {
        const value = event.target.value
        setTheme(value)
    }

    function handleDeviceSelect(event) {
        const selected = event.target.value
        if (selected && controllerSetups[selected]) {
            setActiveSetup(selected)
            setShowDeviceSelect(false)

            const params = new URLSearchParams(window.location.search)
            params.set("device", selected)

            const nextAllowsTheme = !!controllerSetups[selected]?.themes
            if (nextAllowsTheme && theme) {
                params.set("theme", theme)
            } else {
                params.delete("theme")
            }

            const newUrl = `${window.location.pathname}?${params.toString()}`
            window.history.pushState({}, "", newUrl)

            if (!nextAllowsTheme && theme) {
                setTheme("")
            }
        }
    }

    function handleDebugChange(event) {
        const checked = event.target.checked
        setDebug(checked)
        localStorage.setItem("arcadeDebug", checked)
    }

    function handlePinChange(event) {
        const checked = event.target.checked
        setPinned(checked)
        localStorage.setItem("arcadeMenuPinned", checked ? "true" : "false")
        if (checked) {
            setVisible(true)
        }
    }

    function handleMouseEnter() {
        setVisible(true)
    }

    function handleMouseLeave() {
        if (!pinned) {
            setVisible(false)
        }
    }

    function handleRegexChange(e) {
        const raw = e.target.value

        if (!activeSetup) {
            return
        }

        const res = parseRegexInput(raw)

        if (!res.valid) {
            e.target.setCustomValidity(L8N.get("regex_invalid") || "Invalid regular expression")
            e.target.reportValidity()
            return
        }

        e.target.setCustomValidity("")

        // Einheitlich speichern: wenn Flags vorhanden, benutze /src/flags, sonst nur src
        const storeValue = res.flags ? `/${res.source}/${res.flags}` : res.source
        ctrlConfig.set(activeSetup.toLowerCase(), "regex", storeValue)
    }

    // Links nur anzeigen, wenn sichtbar oder gepinnt
    const showLeftLinks = (visible || pinned) && Array.isArray(leftLinks) && leftLinks.length > 0

    return (
        <div
            className="menu-panel-zone"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {showLeftLinks && (
                <div className="menu-left">
                    {leftLinks.map((lnk, idx) => {
                        const key = `${lnk?.label || "link"}-${idx}`
                        return (
                            <button
                                key={key}
                                type="button"
                                className="left-pill"
                                data-id={lnk?.id || ""}
                                data-action={lnk?.action || ""}
                                title={lnk?.title || lnk?.label || "Link"}
                                onClick={lnk?.onClick || (() => {})}
                            >
                                {lnk?.icon ? (
                                    typeof lnk.icon === "string" && lnk.icon.startsWith("<svg")
                                        ? <span className="pill-icon" dangerouslySetInnerHTML={{ __html: lnk.icon }} />
                                        : <span className="pill-icon" aria-hidden="true">★</span>
                                ) : (
                                    <span className="pill-icon" aria-hidden="true">★</span>
                                )}
                                <span className="pill-text">{lnk?.label || "Link"}</span>
                            </button>
                        )
                    })}
                </div>
            )}

            <div className={`menu-panel ${visible ? "visible" : ""}`}>
                {allowTheme && (
                    <div className="menu-section">
                        <label htmlFor="themeSelect">Theme:</label>
                        <select id="themeSelect" onChange={handleThemeChange} value={theme || ""}>
                            <option value="">{L8N.get("default")}</option>
                            {Object.entries(cfg.themes)
                                .filter(([k]) => {
                                    return k !== "default"
                                })
                                .map(([k, label]) => {
                                    return (
                                        <option key={k} value={k}>
                                            {label || (k.charAt(0).toUpperCase() + k.slice(1))}
                                        </option>
                                    )
                                })}
                        </select>
                    </div>
                )}

                <div className="menu-section">
                    <label htmlFor="deviceSelect">{L8N.get("device")}:</label>
                    <select
                        id="deviceSelect"
                        onChange={handleDeviceSelect}
                        defaultValue={activeSetup || ""}
                    >
                        <option value="" disabled>
                            {L8N.get("choose_device")}...
                        </option>
                        {Object.entries(controllerSetups).map(([key, setup]) => {
                            if (!setup.active) {
                                return null
                            }
                            return (
                                <option key={key} value={key}>
                                    {setup.name}
                                </option>
                            )
                        })}
                    </select>
                </div>

                {cfg && (
                    <div className="menu-section">
                        <label htmlFor="deviceRegex">{L8N.get('Regex')}:</label>
                        <input
                            id="deviceRegex"
                            type={"text"}
                            value={cfg?.getRegEx() ?? ''}
                            readOnly={true}
                        />
                    </div>
                )}

                <div className="menu-section debug-toggle">
                    <label htmlFor="debugToggle">{L8N.get("debug.title")}:</label>
                    <input
                        id="debugToggle"
                        type="checkbox"
                        checked={debug}
                        onChange={handleDebugChange}
                    />
                </div>

                {/* Menü anpinnen */}
                <div className="menu-section pin-toggle">
                    <label htmlFor="pinToggle">{L8N.get("always_pin_menu") || "Menü anpinnen"}:</label>
                    <input
                        id="pinToggle"
                        type="checkbox"
                        checked={pinned}
                        onChange={handlePinChange}
                    />
                </div>
            </div>
        </div>
    )
}
