import React, { useEffect, useState } from "react"
import HotasX from "./layouts/HotasX"
import T16000 from "./layouts/T16000"
import ArcadeVenom from "./layouts/ArcadeVenom"
import Xbox from "./layouts/Xbox";
import SNES from "./layouts/SNES";
import NES from "./layouts/NES";
import N64 from "./layouts/N64";
import Genesis from "./layouts/Genesis";
import DebugBox from "./components/DebugBox"
import MenuPanel from "./components/MenuPanel"
import { controllerSetups } from "./config/config"
import { useGamepads } from "./hooks/useGamepads"   // ✅ NEU
import "./styles/style.css"
import {L8N} from "./lib/Localization";

const forcedDevice = null

function getDeviceFromUrl() {
    const params = new URLSearchParams(window.location.search)
    const value = params.get("device")
    return value ? value.toLowerCase() : forcedDevice
}

export default function App() {

    // ✅ neue Quelle für Geräteerkennung: eigener Hook
    const { devices, activeSetup: detectedSetup } = useGamepads()
    const [activeSetup, setActiveSetup] = useState(null)
    const [showDeviceSelect, setShowDeviceSelect] = useState(false)
    const [debug, setDebug] = useState(true)

    // URL & forcedDevice behandeln
    useEffect(() => {
        const urlDevice = getDeviceFromUrl()
        const validUrlDevice = urlDevice && controllerSetups[urlDevice]

        if (forcedDevice) {
            setActiveSetup(forcedDevice)
        } else if (validUrlDevice) {
            setActiveSetup(urlDevice)
        } else if (detectedSetup) {
            setActiveSetup(detectedSetup)
        } else {
            setShowDeviceSelect(true)
        }
    }, [detectedSetup])

    const hasAnyDevice = Object.values(devices).some(arr => arr.length > 0)
    if (!hasAnyDevice && !activeSetup) {
        return (
            <div className="debug active">
                <MenuPanel
                    setShowDeviceSelect={setShowDeviceSelect}
                    activeSetup={activeSetup}
                    setActiveSetup={setActiveSetup}
                    debug={debug}
                    setDebug={setDebug}
                />
                <strong>{L8N.get('error.no_devices_detected')}</strong>
            </div>
        )
    }

    const layoutComponents = {
        HotasX,
        ArcadeVenom,
        Xbox,
        SNES,
        NES,
        N64,
        Genesis,
        T16000,
    }

    let SelectedLayout = null

    if (activeSetup) {
        const setup = controllerSetups[activeSetup.toLowerCase()]
        if (setup && layoutComponents[setup.layout]) {

            if(!setup.active) {
                return (
                    <div className="debug active">
                        <MenuPanel
                            setShowDeviceSelect={setShowDeviceSelect}
                            activeSetup={activeSetup}
                            setActiveSetup={setActiveSetup}
                            debug={debug}
                            setDebug={setDebug}
                        />
                        <strong>{L8N.get('error.device_currently_not_supported', [setup.name])}</strong>
                    </div>
                )
            }

            SelectedLayout = layoutComponents[setup.layout]
        }
    }

    return (
        <div id="overlay">
            <MenuPanel
                setShowDeviceSelect={setShowDeviceSelect}
                activeSetup={activeSetup}
                setActiveSetup={setActiveSetup}
                debug={debug}
                setDebug={setDebug}
            />

            {SelectedLayout && <SelectedLayout />}

            {!SelectedLayout && !showDeviceSelect && (
                <p style={{ color: "#aaa" }}>{L8N.get('press_key_or_stick')}</p>
            )}

            {debug && <DebugBox devices={devices} activeSetup={activeSetup} />}
        </div>
    )
}
