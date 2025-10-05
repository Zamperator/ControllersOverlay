import React, { useEffect, useState } from "react"
import { controllerSetups } from "../config/config"
import "../styles/DebugBox.css"

export default function DebugBox({ devices, activeSetup }) {
    const [debugText, setDebugText] = useState("")
    const [perf, setPerf] = useState({ fps: 0, ram: 0, cpu: 0 })

    useEffect(() => {
        let lastFrame = performance.now()
        let frameCount = 0
        let lastFpsUpdate = performance.now()
        let raf

        function updatePerf() {
            const now = performance.now()
            frameCount++

            // FPS Berechnung alle 500 ms
            if (now - lastFpsUpdate >= 500) {
                const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate))
                frameCount = 0
                lastFpsUpdate = now

                // RAM (Chrome only)
                let ramMB = 0
                if (performance.memory) {
                    const used = performance.memory.usedJSHeapSize / 1048576
                    ramMB = Math.round(used)
                }

                // CPU-Estimate (Δ zwischen Frames)
                const frameDelta = now - lastFrame
                const cpuLoad = Math.min(100, Math.round((frameDelta - 16.7) * 10))
                setPerf({ fps, ram: ramMB, cpu: cpuLoad < 0 ? 0 : cpuLoad })
            }

            lastFrame = now
            raf = requestAnimationFrame(updatePerf)
        }

        updatePerf()
        return () => cancelAnimationFrame(raf)
    }, [])

    useEffect(() => {
        let frame

        function update() {
            const pads = navigator.getGamepads()
            const lines = []

            const hasDevices = Object.values(devices).some(arr => arr.length > 0)
            if (!hasDevices) {
                setDebugText("No devices detected")
                frame = requestAnimationFrame(update)
                return
            }

            lines.push(`Active Setup: ${activeSetup || "none"}`)
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

                    // lines.push(`ID: ${gp.id}`)
                    lines.push(`Index: ${index}`)

                    // Filter unrealistische Achsen (z. B. leere Dummywerte)
                    const axes = gp.axes.length > 10 ? gp.axes.slice(0, 4) : gp.axes

                    lines.push(`Axes (${gp.axes.length})`)
                    axes.forEach((val, i) => {
                        lines.push(`  Axis ${i}: ${val.toFixed(3)}`)
                    })

                    lines.push(`Buttons (${gp.buttons.length})`)
                    gp.buttons.forEach((btn, i) => {
                        lines.push(`  Button ${i}: ${btn.pressed ? "Pressed" : "Released"}`)
                    })

                    lines.push("")
                })
            }

            // Nur aktive Controller anzeigen
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
                <div>FPS: <strong>{perf.fps}</strong></div>
                <div>RAM: <strong>{perf.ram} MB</strong></div>
                <div>CPU: <strong>{perf.cpu}%</strong></div>
            </div>
        </div>
    )
}
