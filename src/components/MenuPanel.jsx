import React, {useEffect, useState} from "react"
import {controllerSetups} from "../config/config"
import "../styles/MenuPanel.css"

export default function MenuPanel({showDeviceSelect, setShowDeviceSelect, activeSetup, setActiveSetup, debug, setDebug}) {
    const [theme, setTheme] = useState(localStorage.getItem("arcadeTheme") || "")
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (theme) {
            document.documentElement.setAttribute("data-theme", theme)
        } else {
            document.documentElement.removeAttribute("data-theme")
        }
        localStorage.setItem("arcadeTheme", theme)
    }, [theme])

    useEffect(() => {
        const storedDebug = localStorage.getItem("arcadeDebug")
        if (storedDebug !== null) {
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
                <div className="menu-section">
                    <label htmlFor="themeSelect">Theme:</label>
                    <select id="themeSelect" onChange={handleThemeChange} value={theme}>
                        <option value="">Default</option>
                        <option value="icy">Icy</option>
                        <option value="matrix">Matrix</option>
                        <option value="inferno">Inferno</option>
                        <option value="retro">Retro</option>
                        <option value="aqua">Aqua</option>
                    </select>
                </div>

                <div className="menu-section">
                    <label htmlFor="deviceSelect">Device:</label>
                    <select
                        id="deviceSelect"
                        onChange={handleDeviceSelect}
                        defaultValue={activeSetup || ""}
                    >
                        <option value="" disabled>Choose device...</option>
                        {Object.entries(controllerSetups).map(([key, setup]) => (
                            <option key={key} value={key}>{setup.name}</option>
                        ))}
                    </select>
                </div>

                <div className="menu-section debug-toggle">
                    <label htmlFor="debugToggle">Debug:</label>
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
