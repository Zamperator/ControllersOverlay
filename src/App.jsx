import React, { useEffect, useState } from "react"
import HotasX from "./layouts/HotasX"
import T16000 from "./layouts/T16000"
import DebugBox from "./components/DebugBox"

import "./styles/style.css"

const forcedDevice = null // "hotasX" | "t16000" | "dual16000"
const isDebug = false;

function getDeviceFromUrl() {
    const params = new URLSearchParams(window.location.search)
    return params.get("device")
}

function detectDevices() {
    const pads = navigator.getGamepads()
    const devices = { hotasX: [], t16000: [], twcs: [], pedals: [] }

    for (const gp of pads) {
        if (!gp) continue
        if (/Hotas\s*X/i.test(gp.id)) devices.hotasX.push(gp.index)
        else if (/T\.16000M/i.test(gp.id)) devices.t16000.push(gp.index)
        else if (/TWCS/i.test(gp.id)) devices.twcs.push(gp.index)
        else if (/TFRP/i.test(gp.id)) devices.pedals.push(gp.index)
    }

    return devices
}

export default function App() {
    const [activeSetup, setActiveSetup] = useState(null)
    const [devices, setDevices] = useState({ hotasX: [], t16000: [], twcs: [], pedals: [] })

    useEffect(() => {
        if (forcedDevice) {
            setActiveSetup(forcedDevice)
        } else {
            const urlDevice = getDeviceFromUrl()
            if (urlDevice) {
                setActiveSetup(urlDevice)
            }
        }

        function poll() {
            setDevices(detectDevices())
            requestAnimationFrame(poll)
        }
        poll()
    }, [])

    if(!activeSetup) {
        return (
            <div className="debug active">
                <strong>No devices detected</strong>
            </div>
        )
    }

    return (
        <div id="overlay">
            {activeSetup.toLowerCase() === "hotasx" && <HotasX />}
            {activeSetup.toLowerCase() === "t16000" && <T16000 />}
            {!activeSetup && <p style={{ color: "#aaa" }}>Press any button or move a stick…</p>}
            {isDebug && (
                <DebugBox devices={devices} activeSetup={activeSetup} />
            )}
        </div>
    )
}
