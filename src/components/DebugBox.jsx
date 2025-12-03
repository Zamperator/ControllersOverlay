import React, {useEffect, useState} from "react"
import {L8N} from "@/lib/Localization"
import "@/styles/components/DebugBox.css"

export default function DebugBox({activeSetup, activeKey}) {
    const [debugText, setDebugText] = useState("")
    const [perf, setPerf] = useState({fps: 0, ram: 0, cpu: 0})

    // Performance viewer (FPS / RAM / simple CPU prediction)
    useEffect(() => {
        let lastFrame = performance.now()
        const frameTimes = []
        let raf

        function updatePerf(now) {
            const delta = now - lastFrame
            lastFrame = now

            frameTimes.push(delta)
            if (frameTimes.length > 60) {
                frameTimes.shift()
            }

            const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
            const fps = Math.max(0, Math.round(1000 / avg))

            const deviation =
                frameTimes.reduce((a, b) => a + Math.abs(b - avg), 0) / frameTimes.length
            const cpuLoad = Math.min(100, Math.round((deviation / 16.7) * 100))

            let ramMB = 0
            if (performance.memory) {
                const used = performance.memory.usedJSHeapSize / 1048576
                ramMB = Math.max(0, Math.round(used))
            }

            setPerf({fps, ram: ramMB, cpu: cpuLoad})
            raf = requestAnimationFrame(updatePerf)
        }

        raf = requestAnimationFrame(updatePerf)
        return () => cancelAnimationFrame(raf)
    }, [])

    // Debug output: connected gamepads only
    useEffect(() => {
        let frame

        function update() {
            const padsRaw = navigator.getGamepads?.() || []
            const pads = Array.from(padsRaw).filter(Boolean)
            const lines = []

            if (pads.length === 0) {
                setDebugText(L8N.get("error.no_devices_detected"))
                frame = requestAnimationFrame(update)
                return
            }

            lines.push(L8N.get("debug.active_setup", [activeSetup || "none"]))
            lines.push("")

            pads.forEach(gp => {
                const key = `${gp.index}:${gp.id}`
                const header = activeKey && key === activeKey
                    ? `=== [ACTIVE] Gamepad #${gp.index} ===`
                    : `=== Gamepad #${gp.index} ===`

                lines.push(header)
                lines.push(`ID: ${gp.id}`)
                if (gp.mapping) {
                    lines.push(`Mapping: ${gp.mapping}`)
                }

                const totalAxes = Array.isArray(gp.axes) ? gp.axes.length : 0
                const axesPreview = totalAxes > 4 ? gp.axes.slice(0, 4) : gp.axes || []
                lines.push(L8N.get("debug.axes", [totalAxes]))
                axesPreview.forEach((val, i) => {
                    const value = typeof val === "number" ? val.toFixed(3) : "0.000"
                    lines.push(`  ${L8N.get("debug.axis", [i, value])}`)
                })

                const totalBtns = Array.isArray(gp.buttons) ? gp.buttons.length : 0
                lines.push(L8N.get("debug.buttons", [totalBtns]))
                if (totalBtns > 0) {
                    gp.buttons.forEach((btn, i) => {
                        const pressed = !!btn?.pressed
                        const state = pressed ? "pressed" : "released"
                        lines.push(`  ${L8N.get("debug.button", [i, L8N.get(`debug.${state}`)])}`)
                    })
                }

                lines.push("")
            })

            setDebugText(lines.join("\n"))
            frame = requestAnimationFrame(update)
        }

        update()
        return () => cancelAnimationFrame(frame)
    }, [activeSetup, activeKey])

    return (
        <div className="debug-wrapper">
            <div className="perf-panel">
                <div>FPS: <strong>{perf.fps}</strong></div>
                {perf.ram > 0 && (
                    <div>RAM: <strong>{perf.ram} MB</strong></div>
                )}
                <div>CPU: <strong>{perf.cpu}%</strong></div>
            </div>
            <pre className="debug active">{debugText}</pre>
        </div>
    )
}
