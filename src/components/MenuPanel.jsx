import React, {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {controllerSetups, getControllerSetup} from "@/config/config"
import {L8N} from "@/lib/Localization"
import ctrlConfig from "@/config/ctrlConfig"

import "@/styles/components/MenuPanel.css"

export default function MenuPanel({
                                      setShowDeviceSelect,
                                      activeSetup,
                                      setActiveSetup,
                                      debug,
                                      setDebug,
                                      leftLinks = []
                                  }) {

    const [selectedPadKey, setSelectedPadKey] = useState("")
    const selectedPadKeyRef = useRef("")

    const getInitialTheme = () => {
        const params = new URLSearchParams(window.location.search)
        const urlTheme = (params.get("theme") || "").trim()
        const storedTheme = (localStorage.getItem("arcadeTheme") || "").trim()

        return urlTheme || storedTheme || ""
    }

    const getInitialPinned = () => {
        return localStorage.getItem("arcadeMenuPinned") === "true"
    }

    const getInitialModules = () => {
        return new URLSearchParams(window.location.search).get("modules") ?? ""
    }

    const [theme, setTheme] = useState(() => getInitialTheme())
    const [currentModules, setCurrentModules] = useState(() => getInitialModules())
    const [pinned, setPinned] = useState(() => getInitialPinned())
    const [visible, setVisible] = useState(() => getInitialPinned())

    const cfg = useMemo(() => {
        if (!activeSetup) {
            return null
        }

        return getControllerSetup(activeSetup)
    }, [activeSetup])

    const allowTheme   = !!activeSetup && !!cfg?.themes
    const allowModules = !!activeSetup && !!cfg?.modules
    const showLeftLinks = (visible || pinned) && Array.isArray(leftLinks) && leftLinks.length > 0

    const replaceUrlParams = useCallback((mutate) => {
        const params = new URLSearchParams(window.location.search)

        mutate(params)

        const query = params.toString()
        const newUrl = query
            ? `${window.location.pathname}?${query}`
            : window.location.pathname

        window.history.replaceState({}, "", newUrl)
    }, [])

    const pushUrlParams = useCallback((mutate) => {
        const params = new URLSearchParams(window.location.search)

        mutate(params)

        const query = params.toString()
        const newUrl = query
            ? `${window.location.pathname}?${query}`
            : window.location.pathname

        window.history.pushState({}, "", newUrl)
    }, [])

    const snapshotGamepads = useCallback(() => {
        return Array.from(navigator.getGamepads ? navigator.getGamepads() : [])
            .filter(Boolean)
            .map((gp) => {
                return {
                    key: `${gp.index}:${gp.id}`,
                    index: gp.index,
                    id: gp.id,
                    mapping: gp.mapping || "standard",
                    buttons: gp.buttons?.length || 0,
                    axes: gp.axes?.length || 0,
                    label: gp.id?.trim() || `Gamepad ${gp.index}`
                }
            })
            .sort((a, b) => {
                if (a.mapping !== b.mapping) {
                    return a.mapping === "standard" ? -1 : 1
                }

                const labelCompare = a.label.localeCompare(b.label)
                if (labelCompare !== 0) {
                    return labelCompare
                }

                return a.index - b.index
            })
    }, [])

    const loadStoredPadKey = useCallback(() => {
        try {
            const idx = ctrlConfig.get?.("input", "gamepadIndex")
            const id = ctrlConfig.get?.("input", "gamepadId")

            if (typeof idx === "number" && id) {
                return `${idx}:${id}`
            }
        } catch {
        }

        const storedKey = localStorage.getItem("arcadeSelectedGamepadKey")
        return storedKey || ""
    }, [])

    const persistPadSelection = useCallback((pad) => {
        try {
            ctrlConfig.set?.("input", "gamepadIndex", pad?.index ?? null)
            ctrlConfig.set?.("input", "gamepadId", pad?.id ?? "")
        } catch {
        }

        if (pad) {
            localStorage.setItem("arcadeSelectedGamepadKey", pad.key)
        } else {
            localStorage.removeItem("arcadeSelectedGamepadKey")
        }
    }, [])

    useEffect(() => {
        selectedPadKeyRef.current = selectedPadKey
    }, [selectedPadKey])

    // --- FIX: On reload, set activeSetup from URL early so allowTheme is correct
    useEffect(() => {
        if (activeSetup) {
            return
        }

        const params = new URLSearchParams(window.location.search)
        const device = (params.get("device") || "").trim()

        if (!device) {
            return
        }

        if (!controllerSetups[device]) {
            return
        }

        setActiveSetup(device)
    }, [activeSetup, setActiveSetup])

    useEffect(() => {
        const storedDebug = localStorage.getItem("arcadeDebug")

        if (storedDebug === null) {
            setDebug(false)
            localStorage.setItem("arcadeDebug", "false")
            return
        }

        setDebug(storedDebug === "true")
    }, [setDebug])

    // --- FIX: Do not delete theme from URL/localStorage while activeSetup isn't known yet
    useEffect(() => {

        // During initial load activeSetup can be empty for a moment -> don't wipe ?theme=...
        if (!activeSetup) {
            return
        }

        if (!allowTheme) {
            if (theme) {
                setTheme("")
            }

            document.documentElement.removeAttribute("data-theme")

            replaceUrlParams((params) => {
                params.delete("theme")
            })

            localStorage.removeItem("arcadeTheme")
            return
        }

        if (!theme) {
            document.documentElement.removeAttribute("data-theme")
            localStorage.removeItem("arcadeTheme")
        } else {
            document.documentElement.dataset.theme = theme

            if (document.body) {
                document.body.dataset.theme = theme
            }
            localStorage.setItem("arcadeTheme", theme)
        }

        replaceUrlParams((params) => {
            if (theme) {
                params.set("theme", theme)
            } else {
                params.delete("theme")
            }
        })
    }, [activeSetup, allowTheme, theme, replaceUrlParams])

    useEffect(() => {
        const pads = snapshotGamepads()
        const storedKey = loadStoredPadKey()

        if (storedKey) {
            const existingPad = pads.find((pad) => {
                return pad.key === storedKey
            })

            if (existingPad) {
                setSelectedPadKey(storedKey)
                selectedPadKeyRef.current = storedKey
            } else {
                persistPadSelection(null)
            }
        } else if (pads.length === 1) {
            setSelectedPadKey(pads[0].key)
            selectedPadKeyRef.current = pads[0].key
            persistPadSelection(pads[0])
        }

        function onConnect() {
            const list = snapshotGamepads()

            if (!selectedPadKeyRef.current && list.length === 1) {
                setSelectedPadKey(list[0].key)
                selectedPadKeyRef.current = list[0].key
                persistPadSelection(list[0])
            }
        }

        function onDisconnect() {
            const list = snapshotGamepads()
            const currentKey = selectedPadKeyRef.current

            if (!currentKey) {
                return
            }

            const stillExists = list.find((pad) => {
                return pad.key === currentKey
            })

            if (!stillExists) {
                setSelectedPadKey("")
                selectedPadKeyRef.current = ""
                persistPadSelection(null)
            }
        }

        window.addEventListener("gamepadconnected", onConnect)
        window.addEventListener("gamepaddisconnected", onDisconnect)

        return () => {
            window.removeEventListener("gamepadconnected", onConnect)
            window.removeEventListener("gamepaddisconnected", onDisconnect)
        }
    }, [snapshotGamepads, loadStoredPadKey, persistPadSelection])

    function handleThemeChange(event) {
        setTheme(event.target.value)
    }

    function handleModulesChange(event) {
        const val = event.target.value
        setCurrentModules(val)
        replaceUrlParams((params) => {
            if (val) {
                params.set("modules", val)
            } else {
                params.delete("modules")
            }
        })
        window.location.reload()
    }

    function handleDeviceSelect(event) {
        const selected = event.target.value

        if (!selected || !controllerSetups[selected]) {
            return
        }

        setActiveSetup(selected)
        setShowDeviceSelect(false)

        const nextAllowsTheme = !!controllerSetups[selected]?.themes

        pushUrlParams((params) => {
            params.set("device", selected)

            if (nextAllowsTheme && theme) {
                params.set("theme", theme)
            } else {
                params.delete("theme")
            }
        })

        if (!nextAllowsTheme && theme) {
            setTheme("")
        }
    }

    function handleDebugChange(event) {
        const checked = event.target.checked

        setDebug(checked)
        localStorage.setItem("arcadeDebug", checked ? "true" : "false")
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
                                        ? <span className="pill-icon" dangerouslySetInnerHTML={{__html: lnk.icon}} />
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

                <div className="menu-section">
                    <label htmlFor="deviceSelect">{L8N.get("device")}:</label>
                    <select
                        id="deviceSelect"
                        onChange={handleDeviceSelect}
                        value={activeSetup || ""}
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

                {allowTheme && (
                    <div className="menu-section">
                        <label htmlFor="themeSelect">Theme:</label>
                        <select id="themeSelect" onChange={handleThemeChange} value={theme}>
                            <option value="">{L8N.get("default")}</option>
                            {Object.entries(cfg.themes)
                                .filter(([key]) => {
                                    return key !== "default"
                                })
                                .map(([key, label]) => {
                                    return (
                                        <option key={key} value={key}>
                                            {label || (key.charAt(0).toUpperCase() + key.slice(1))}
                                        </option>
                                    )
                                })}
                        </select>
                    </div>
                )}

                {allowModules && (
                    <div className="menu-section">
                        <label htmlFor="modulesSelect">Setup:</label>
                        <select
                            id="modulesSelect"
                            onChange={handleModulesChange}
                            value={currentModules}
                        >
                            <option value="" disabled>Auswählen…</option>
                            {Object.entries(cfg.modules).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="menu-section pin-toggle">
                    <label htmlFor="pinToggle">{L8N.get("always_pin_menu") || "Menü anpinnen"}:</label>
                    <input
                        id="pinToggle"
                        type="checkbox"
                        checked={pinned}
                        onChange={handlePinChange}
                    />
                </div>

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