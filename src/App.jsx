import React, {useEffect, useState} from "react"
import HotasX from "./layouts/HotasX"
import T16000 from "./layouts/T16000"
import ArcadeVenom from "./layouts/ArcadeVenom"
import Xbox from "./layouts/Xbox"
import SNES from "./layouts/SNES"
import NES from "./layouts/NES"
import N64 from "./layouts/N64"
import GameCube from "./layouts/GameCube"
import Genesis from "./layouts/Genesis"
import DebugBox from "./components/DebugBox"
import MenuPanel from "./components/MenuPanel"
import {controllerSetups} from "./config/config"
import {GamepadProvider, useGamepads} from "./hooks/GamepadContext"
import "./styles/style.css"
import {L8N} from "./lib/Localization"

const forcedDevice = null

function getDeviceFromUrl() {
    const params = new URLSearchParams(window.location.search)
    const value = params.get("device")
    return value ? value.toLowerCase() : forcedDevice
}

function AppWithProvider() {
    const [debug, setDebug] = useState(true)

    return (
        <GamepadProvider
            enabled={debug}                               // <- hier wird gepollt oder nicht
            options={{intervalMs: 60, timeoutMs: 1500, deadzone: .22}}
        >
            <AppInner debug={debug} setDebug={setDebug}/>
        </GamepadProvider>
    )
}

function AppInner() {
    const {activeKey, hasAny} = useGamepads()
    const [activeSetup, setActiveSetup] = useState(null)
    const [showDeviceSelect, setShowDeviceSelect] = useState(false)
    const [debug, setDebug] = useState(true)

    const Menu = () => (
        <MenuPanel
            setShowDeviceSelect={setShowDeviceSelect}
            activeSetup={activeSetup}
            setActiveSetup={setActiveSetup}
            debug={debug}
            setDebug={setDebug}
            leftLinks={[{ label: L8N.get('help') }]}
        />
    )

    // Initial: URL erzwingt Gerät oder Selector anzeigen
    useEffect(() => {
        const urlDevice = getDeviceFromUrl()
        const validUrlDevice = urlDevice && controllerSetups[urlDevice]
        if (forcedDevice) {
            setActiveSetup(forcedDevice)
        }
        else if (validUrlDevice) {
            setActiveSetup(urlDevice)
        }
        else {
            setShowDeviceSelect(true)
        }
    }, [])

    const layoutComponents = {
        HotasX,
        ArcadeVenom,
        Xbox,
        SNES,
        NES,
        N64,
        GameCube,
        Genesis,
        T16000
    }

    let SelectedLayout = null
    if (activeSetup) {
        const setup = controllerSetups[activeSetup.toLowerCase()]
        if (setup && layoutComponents[setup.layout]) {
            if (!setup.active) {
                return (
                    <div className="debug active">
                        <Menu/>
                        <strong>{L8N.get("error.device_currently_not_supported", [setup.name])}</strong>
                    </div>
                )
            }
            SelectedLayout = layoutComponents[setup.layout]
        }
    }

    if (!hasAny && !activeSetup) {
        return (
            <div className="debug active">
                <Menu/>
                <strong>{L8N.get("error.no_devices_detected")}</strong>
            </div>
        )
    }

    return (
        <div id="overlay">
            <Menu/>

            {SelectedLayout && <SelectedLayout/>}

            {!SelectedLayout && !showDeviceSelect && (
                <p style={{color: "#aaa"}}>{L8N.get("press_key_or_stick")}</p>
            )}

            {debug && <DebugBox activeSetup={activeSetup} activeKey={activeKey}/>}
        </div>
    )
}

export default function App() {
    return (
        <AppWithProvider/>
    )
}
