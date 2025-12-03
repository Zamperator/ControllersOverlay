import React, {useEffect, useMemo, useState} from "react"
import {controllerSetups, getControllerSetup} from "@/config/config"
import {L8N} from "@/lib/Localization"
import ctrlConfig from "@/config/ctrlConfig";

import "@/styles/components/MenuPanel.css"

export default function MenuPanel({
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
    const [selectedPadKey, setSelectedPadKey] = useState('')

    const cfg = getControllerSetup(activeSetup)

    // Are themes allowed for the current setup?
    const allowTheme = useMemo(() => {
        if (!activeSetup) {
            return false
        }
        return !!cfg?.themes
    }, [activeSetup, cfg])

    function snapshotGamepads() {
        return Array.from(navigator.getGamepads ? navigator.getGamepads() : [])
            .filter(Boolean)
            .map(gp => ({
                key: `${gp.index}:${gp.id}`,
                index: gp.index,
                id: gp.id,
                mapping: gp.mapping || 'standard',
                buttons: gp.buttons?.length || 0,
                axes: gp.axes?.length || 0,
                label: gp.id?.trim() || `Gamepad ${gp.index}`
            }))
            // stable sorting: first "standard", then name, then index
            .sort((a, b) => (a.mapping === b.mapping ? 0 : a.mapping === 'standard' ? -1 : 1)
                || a.label.localeCompare(b.label)
                || a.index - b.index)
    }

    function loadStoredPadKey() {
        // prefer ctrlConfig if available
        try {
            const idx = ctrlConfig.get?.('input', 'gamepadIndex')
            const id = ctrlConfig.get?.('input', 'gamepadId')
            if (typeof idx === 'number' && id) {
                return `${idx}:${id}`
            }
        } catch {
        }
        const k = localStorage.getItem('arcadeSelectedGamepadKey')
        return k || ''
    }

    function persistPadSelection(pad) {
        try {
            ctrlConfig.set?.('input', 'gamepadIndex', pad?.index ?? null)
            ctrlConfig.set?.('input', 'gamepadId', pad?.id ?? '')
        } catch {
        }
        if (pad) {
            localStorage.setItem('arcadeSelectedGamepadKey', pad.key)
        }
        else {
            localStorage.removeItem('arcadeSelectedGamepadKey')
        }
    }

    // === Initialising: URL > localStorage ===
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const urlTheme = params.get("theme")
        const storedTheme = localStorage.getItem("arcadeTheme")
        const storedPin = localStorage.getItem("arcadeMenuPinned")

        if (urlTheme) {
            setTheme(urlTheme)
        }
        else {
            if (storedTheme) {
                setTheme(storedTheme)
            }
        }

        if (storedPin === "true") {
            setPinned(true)
            setVisible(true)
        }
    }, [])

    // Use/Save theme when changed (if allowed)
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
        }
        else {
            document.documentElement.setAttribute("data-theme", theme)
            localStorage.setItem("arcadeTheme", theme)
        }

        const params = new URLSearchParams(window.location.search)
        if (theme) {
            params.set("theme", theme)
        }
        else {
            params.delete("theme")
        }
        const newUrl = `${window.location.pathname}?${params.toString()}`
        window.history.replaceState({}, "", newUrl)
    }, [theme, allowTheme])

    // === Load Debug-Mode (Default: false) ===
    useEffect(() => {
        const storedDebug = localStorage.getItem("arcadeDebug")
        if (storedDebug === null) {
            setDebug(false)
            localStorage.setItem("arcadeDebug", "false")
        }
        else {
            const parsed = storedDebug === "true"
            setDebug(parsed)
        }
    }, [setDebug])

    useEffect(() => {
        const initial = snapshotGamepads()
        // restore existing selection
        const storedKey = loadStoredPadKey()
        if (storedKey) {
            const hit = initial.find(g => g.key === storedKey)
            if (hit) {
                setSelectedPadKey(storedKey)
            }
            else {
                persistPadSelection(null)
            } // not available
        }

        function onConnect() {
            const list = snapshotGamepads()
            // if no pad selected, but only one available → auto-select
            if (!selectedPadKey && list.length === 1) {
                setSelectedPadKey(list[0].key)
                persistPadSelection(list[0])
            }
        }

        function onDisconnect() {
            const list = snapshotGamepads()
            if (selectedPadKey && !list.find(g => g.key === selectedPadKey)) {
                // selected pad is gone
                setSelectedPadKey('')
                persistPadSelection(null)
            }
        }

        window.addEventListener('gamepadconnected', onConnect)
        window.addEventListener('gamepaddisconnected', onDisconnect)
        return () => {
            window.removeEventListener('gamepadconnected', onConnect)
            window.removeEventListener('gamepaddisconnected', onDisconnect)
        }
    }, [selectedPadKey]) // only once

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
            }
            else {
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

    // Show links only when visible or pinned
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
                                onClick={lnk?.onClick || (() => {
                                })}
                            >
                                {lnk?.icon ? (
                                    typeof lnk.icon === "string" && lnk.icon.startsWith("<svg")
                                        ? <span className="pill-icon" dangerouslySetInnerHTML={{__html: lnk.icon}}/>
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

                {/* Pin menu */}
                <div className="menu-section pin-toggle">
                    <label htmlFor="pinToggle">{L8N.get("always_pin_menu") || "Menü anpinnen"}:</label>
                    <input
                        id="pinToggle"
                        type="checkbox"
                        checked={pinned}
                        onChange={handlePinChange}
                    />
                </div>

                {/* Debug */}
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
