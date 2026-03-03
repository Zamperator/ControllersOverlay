import React, {useEffect, useRef, useState} from "react"
import {L8N} from "@/lib/Localization"
import "@/styles/components/DebugBox.css"

export default function DebugBox({activeSetup, activeKey}) {
    const [debugText, setDebugText] = useState("")
    const [perf, setPerf] = useState({fps: 0, ram: 0, cpu: 0})

    // Keep last values to detect movement / "used" inputs
    const lastAxesRef = useRef(new Map())
    const lastButtonsRef = useRef(new Map())

    // Tuning knobs
    const AXIS_EPS_MOVE = 0.003
    const AXIS_EPS_NONZERO = 0.02
    const AXIS_CONTEXT = 1

    const BTN_EPS_VALUE = 0.05
    const BTN_BASE_COUNT = 12
    const BTN_CONTEXT = 1

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

        function fmtNum(n, digits = 3) {
            if (typeof n !== "number" || Number.isNaN(n)) {
                return "0.000"
            }
            return n.toFixed(digits)
        }

        function isAxisUsed(v, prev) {
            const vv = typeof v === "number" ? v : 0
            const pp = typeof prev === "number" ? prev : 0
            const delta = Math.abs(vv - pp)

            if (delta > AXIS_EPS_MOVE) {
                return true
            }
            if (Math.abs(vv) > AXIS_EPS_NONZERO) {
                return true
            }
            return false
        }

        function isButtonUsed(btn, prevBtn) {
            const pressed = !!btn?.pressed
            const value = typeof btn?.value === "number" ? btn.value : 0

            const prevPressed = !!prevBtn?.pressed
            const prevValue = typeof prevBtn?.value === "number" ? prevBtn.value : 0

            if (pressed) {
                return true
            }
            if (value > BTN_EPS_VALUE) {
                return true
            }

            // show transitions as "used" for a moment (press/release spikes)
            if (pressed !== prevPressed) {
                return true
            }
            if (Math.abs(value - prevValue) > BTN_EPS_VALUE) {
                return true
            }

            return false
        }

        function pushHiddenRange(lines, labelSingular, labelPlural, from, to) {
            if (from < 0 || to < 0 || to < from) {
                return
            }

            if (from === to) {
                lines.push(`  … ${labelSingular} ${from} unused …`)
            } else {
                lines.push(`  … ${labelPlural} ${from}–${to} unused …`)
            }
        }

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

                // -------- Axes (compressed, but shows active/moving + context) --------
                const axes = Array.isArray(gp.axes) ? gp.axes : []
                lines.push(L8N.get("debug.axes", [axes.length]))

                const lastAxes = lastAxesRef.current.get(key) || []
                const nextAxes = axes.slice()

                const usedAxes = axes.map((val, i) => {
                    return isAxisUsed(val, lastAxes[i])
                })

                function axisInContext(i) {
                    for (let j = Math.max(0, i - AXIS_CONTEXT); j <= Math.min(axes.length - 1, i + AXIS_CONTEXT); j++) {
                        if (usedAxes[j]) {
                            return true
                        }
                    }
                    return usedAxes[i]
                }

                let hiddenStart = -1
                for (let i = 0; i < axes.length; i++) {
                    const show = axisInContext(i)

                    if (!show) {
                        if (hiddenStart === -1) {
                            hiddenStart = i
                        }
                        continue
                    }

                    if (hiddenStart !== -1) {
                        pushHiddenRange(lines, "axis", "axes", hiddenStart, i - 1)
                        hiddenStart = -1
                    }

                    const marker = usedAxes[i] ? "*" : " "
                    lines.push(` ${marker} ${L8N.get("debug.axis", [i, fmtNum(axes[i])])}`)
                }

                if (hiddenStart !== -1) {
                    pushHiddenRange(lines, "axis", "axes", hiddenStart, axes.length - 1)
                }

                lastAxesRef.current.set(key, nextAxes)

                // -------- Buttons (base first N + active/moving + context, rest hidden) --------
                const buttons = Array.isArray(gp.buttons) ? gp.buttons : []
                lines.push(L8N.get("debug.buttons", [buttons.length]))

                const lastButtons = lastButtonsRef.current.get(key) || []
                const nextButtons = buttons.map(b => {
                    return {
                        pressed: !!b?.pressed,
                        value: typeof b?.value === "number" ? b.value : 0
                    }
                })

                const usedButtons = buttons.map((btn, i) => {
                    return isButtonUsed(btn, lastButtons[i])
                })

                const showButton = new Array(buttons.length).fill(false)

                // base buttons always visible (0..BTN_BASE_COUNT-1)
                for (let i = 0; i < Math.min(BTN_BASE_COUNT, buttons.length); i++) {
                    showButton[i] = true
                }

                // active buttons + context around them
                for (let i = 0; i < buttons.length; i++) {
                    if (usedButtons[i]) {
                        for (let j = Math.max(0, i - BTN_CONTEXT); j <= Math.min(buttons.length - 1, i + BTN_CONTEXT); j++) {
                            showButton[j] = true
                        }
                    }
                }

                // Now render, compress hidden ranges
                let hiddenBtnStart = -1
                for (let i = 0; i < buttons.length; i++) {
                    if (!showButton[i]) {
                        if (hiddenBtnStart === -1) {
                            hiddenBtnStart = i
                        }
                        continue
                    }

                    if (hiddenBtnStart !== -1) {
                        pushHiddenRange(lines, "button", "buttons", hiddenBtnStart, i - 1)
                        hiddenBtnStart = -1
                    }

                    const btn = buttons[i]
                    const pressed = !!btn?.pressed
                    const state = pressed ? "pressed" : "released"
                    const value = typeof btn?.value === "number" ? btn.value : 0

                    const marker = usedButtons[i] ? "*" : " "
                    lines.push(` ${marker} ${L8N.get("debug.button", [i, L8N.get(`debug.${state}`)])} (value: ${fmtNum(value)})`)
                }

                if (hiddenBtnStart !== -1) {
                    pushHiddenRange(lines, "button", "buttons", hiddenBtnStart, buttons.length - 1)
                }

                lastButtonsRef.current.set(key, nextButtons)

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