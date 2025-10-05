import React, { useEffect, useState } from "react"
import { controllerSetups } from "../config/config"
import "../styles/MenuPanel.css"
import { L8N } from "../lib/Localization"

export default function MenuPanel({
                                      showDeviceSelect,
                                      setShowDeviceSelect,
                                      activeSetup,
                                      setActiveSetup,
                                      debug,
                                      setDebug
                                  }) {
    const [theme, setTheme] = useState("")
    const [visible, setVisible] = useState(false)

    // === Initialisierung: URL > localStorage ===
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const urlTheme = params.get("theme")
        const storedTheme = localStorage.getItem("arcadeTheme")

        if (urlTheme) {
            setTheme(urlTheme)
        } else if (storedTheme) {
            setTheme(storedTheme)
        }
    }, [])

    // === Theme anwenden + speichern + URL synchronisieren ===
    useEffect(() => {
        if (!theme) {
            document.documentElement.removeAttribute("data-theme")
        } else {
            document.documentElement.setAttribute("data-theme", theme)
        }

        if (theme) {
            localStorage.setItem("arcadeTheme", theme)
        } else {
            localStorage.removeItem("arcadeTheme")
        }

        const params = new URLSearchParams(window.location.search)
        if (theme) {
            params.set("theme", theme)
        } else {
            params.delete("theme")
        }
        const newUrl = `${window.location.pathname}?${params.toString()}`
        window.history.replaceState({}, "", newUrl)
    }, [theme])

    // === Debug-Zustand laden ===
    useEffect(() => {
        const storedDebug = localStorage.getItem("arcadeDebug")

        if (storedDebug === null) {
            // kein gespeicherter Wert → Default false
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
            if (theme) {
                params.set("theme", theme)
            }

            const newUrl = `${window.location.pathname}?${params.toString()}`
            window.history.pushState({}, "", newUrl)
        }
    }

    function handleDebugChange(event) {
        const checked = event.target.checked
        setDebug(checked)
        localStorage.setItem("arcadeDebug", checked)
    }

    function handleMouseEnter() {
        setVisible(true)
    }

    function handleMouseLeave() {
        setVisible(false)
    }

    return (
        <div
            className="menu-panel-zone"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className={`menu-panel ${visible ? "visible" : ""}`}>
                {/* === THEME === */}
                <div className="menu-section">
                    <label htmlFor="themeSelect">Theme:</label>
                    <select id="themeSelect" onChange={handleThemeChange} value={theme}>
                        <option value="">{L8N.get("default")}</option>
                        <option value="icy">Icy</option>
                        <option value="matrix">Matrix</option>
                        <option value="inferno">Inferno</option>
                        <option value="retro">Retro</option>
                        <option value="aqua">Aqua</option>
                    </select>
                </div>

                {/* === DEVICE === */}
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

                {/* === DEBUG === */}
                <div className="menu-section debug-toggle">
                    <label htmlFor="debugToggle">{L8N.get("debug.title")}:</label>
                    <input
                        id="debugToggle"
                        type="checkbox"
                        checked={debug}
                        onChange={handleDebugChange}
                    />
                </div>
            </div>
        </div>
    )
}
