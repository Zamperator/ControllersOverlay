import React, { useEffect, useState } from "react"
import { controllerSetups } from "../config/config"
import "../styles/DebugBox.css"
import { L8N } from "../lib/Localization"

export default function DebugBox({ devices, activeSetup }) {
    const [debugText, setDebugText] = useState("")
    const [perf, setPerf] = useState({ fps: 0, ram: 0, cpu: 0 })

    useEffect(() => {
        let lastFrame = performance.now()
        const frameTimes = []
        let raf

        function updatePerf(now) {
            const delta = now - lastFrame
            lastFrame = now

            // Letzte 60 Frames sammeln (ca. 1 s)
            frameTimes.push(delta)
            if (frameTimes.length > 60) {
                frameTimes.shift()
            }

            // Durchschnitts-FPS
            const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
            const fps = Math.round(1000 / avg)

            // Jitter = Framezeit-Schwankung = „gefühlte“ CPU-Last
            const deviation =
                frameTimes.reduce((a, b) => a + Math.abs(b - avg), 0) /
                frameTimes.length
            const cpuLoad = Math.min(100, Math.round((deviation / 16.7) * 100))

            // RAM (nur Chrome)
            let ramMB = 0
            if (performance.memory) {
                const used = performance.memory.usedJSHeapSize / 1048576
                ramMB = Math.round(used)
            }

            setPerf({ fps, ram: ramMB, cpu: cpuLoad })
            raf = requestAnimationFrame(updatePerf)
        }

        raf = requestAnimationFrame(updatePerf)
        return () => cancelAnimationFrame(raf)
    }, [])

    useEffect(() => {
        let frame

        function update() {
            const pads = navigator.getGamepads()
            const lines = []

            const hasDevices = Object.values(devices).some(arr => arr.length > 0)
            if (!hasDevices) {
                setDebugText(L8N.get("error.no_devices_detected"))
                frame = requestAnimationFrame(update)
                return
            }

            lines.push(L8N.get("debug.active_setup", [activeSetup || "none"]))
            lines.push("")

            function dumpDevice(title, indices) {
                if (!indices || indices.length === 0) {
                    return
                }

                lines.push(`=== ${title} ===`)
                indices.forEach(index => {
                    const gp = pads[index]
                    if (!gp) {
                        return
                    }

                    lines.push(`ID: ${gp.id}`)
                    lines.push(`Index: ${index}`)

                    // Filter unrealistische Achsen (z. B. leere Dummywerte)
                    const axes = gp.axes.length > 10 ? gp.axes.slice(0, 4) : gp.axes

                    lines.push(L8N.get('debug.axes', [gp.axes.length]))
                    axes.forEach((val, i) => {
                        lines.push(`  ${L8N.get("debug.axis", [i, val.toFixed(3)])}`)
                    })

                    lines.push(L8N.get('debug.buttons', [gp.buttons.length]))
                    gp.buttons.forEach((btn, i) => {
                        const state = btn.pressed ? "pressed" : "released"
                        lines.push(
                            `  ${L8N.get("debug.button", [i, L8N.get(`debug.${state}`)])}`
                        )
                    })

                    lines.push("")
                })
            }

            Object.entries(devices).forEach(([key, indices]) => {
                if (indices && indices.length > 0) {
                    const setup = controllerSetups[key]
                    const title = setup ? setup.name : key
                    dumpDevice(title, indices)
                }
            })

            setDebugText(lines.join("\n"))
            frame = requestAnimationFrame(update)
        }

        update()
        return () => cancelAnimationFrame(frame)
    }, [devices, activeSetup])

    return (
        <div className="debug-wrapper">
            <pre className="debug active">{debugText}</pre>
            <div className="perf-panel">
                <div>
                    FPS: <strong>{perf.fps}</strong>
                </div>
                {perf.ram > 0 && (
                    <div>
                        RAM: <strong>{perf.ram} MB</strong>
                    </div>
                )}
                <div>
                    CPU: <strong>{perf.cpu}%</strong>
                </div>
            </div>
        </div>
    )
}
