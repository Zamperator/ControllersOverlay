import React, {useEffect, useRef, useMemo, useState} from "react"
import {makeActiveGamepadPicker} from "@/lib/activeGamepad"
import "@/styles/devices/HotasX.css"

export default function HotasX() {

    const stickInd = useRef(null)
    const rudderInd = useRef(null)
    const throttleFill = useRef(null)
    const sliderHandle = useRef(null)

    const hatBase = useRef(null)
    const hatKnob = useRef(null)

    const buttons = useRef({})

    const [throttlePct, setThrottlePct] = useState(0)

    const buttonMap = useMemo(() => ({
        0: "F",   // Fire
        1: "L1",
        3: "L3",
        4: "5",
        5: "6",
        6: "7",
        7: "8",
        8: "R2",
        9: "L2",
        10: "SE",
        11: "ST"
    }), [])

    const activeController = useMemo(() => makeActiveGamepadPicker({timeoutMs: 2000, deadzone: .15}), [])

    useEffect(() => {
        let raf

        const povToVector = (pov) => {

            if (pov === null || pov === undefined) {
                return {active: false, x: 0, y: 0}
            }

            // Many devices report neutral as 0.0
            if (Math.abs(pov) < 0.05) {
                return {active: false, x: 0, y: 0}
            }

            const steps = [
                {v: -1.0, a: 0},
                {v: -0.714, a: 45},
                {v: -0.428, a: 90},
                {v: -0.143, a: 135},
                {v: 0.143, a: 180},
                {v: 0.428, a: 225},
                {v: 0.714, a: 270},
                {v: 1.0, a: 315},
            ]

            let best = null
            let bestDiff = Infinity

            for (const s of steps) {
                const diff = Math.abs(pov - s.v)
                if (diff < bestDiff) {
                    bestDiff = diff
                    best = s
                }
            }

            if (!best || bestDiff > 0.08) {
                return {active: false, x: 0, y: 0}
            }

            // angle: 0 = up, 90 = right, 180 = down, 270 = left
            const rad = (best.a * Math.PI) / 180
            const x = Math.sin(rad)
            const y = -Math.cos(rad)

            return {active: true, x, y}
        }

        const moveIndicatorInBox = (indicatorEl, x, y) => {
            if (!indicatorEl || !indicatorEl.parentElement) {
                return
            }

            const box = indicatorEl.parentElement.getBoundingClientRect()
            const ind = indicatorEl.getBoundingClientRect()

            const rangeX = (box.width - ind.width) / 2
            const rangeY = (box.height - ind.height) / 2

            indicatorEl.style.transform = `translate(${x * rangeX}px, ${y * rangeY}px)`
        }

        const moveHat = (baseEl, knobEl, x, y) => {
            if (!baseEl || !knobEl) {
                return
            }

            const box = baseEl.getBoundingClientRect()
            const ind = knobEl.getBoundingClientRect()

            const rangeX = (box.width - ind.width) / 2
            const rangeY = (box.height - ind.height) / 2

            knobEl.style.transform = `translate(calc(-50% + ${x * rangeX}px), calc(-50% + ${y * rangeY}px))`
        }

        function update() {
            const pads = navigator.getGamepads?.() || []
            const gp = activeController(pads, null)

            if (!gp) {
                raf = requestAnimationFrame(update)
                return
            }

            // === Stick (X/Y) ===
            moveIndicatorInBox(stickInd.current, gp.axes[0] ?? 0, gp.axes[1] ?? 0)

            // === Rudder (axis 5) ===
            if (rudderInd.current && rudderInd.current.parentElement) {
                const box = rudderInd.current.parentElement.getBoundingClientRect()
                const r = gp.axes[5] ?? 0 // –1 … +1
                const pos = ((r + 1) / 2) * box.width
                rudderInd.current.style.left = `${pos}px`
            }

            // === Throttle (axis 2) ===
            if (throttleFill.current) {
                const z = -(gp.axes[2] ?? 0)           // –1 … +1
                const pct = Math.round(z * 100)        // –100 … +100
                setThrottlePct(pct)

                // Height (inverted to match physical movement)
                const heightPct = ((pct + 100) / 200) * 100
                throttleFill.current.style.height = `${heightPct}%`

                // Color (Hue 0 = Rot → 120 = Grün)
                const hue = (pct + 100) * 0.6          // -100 = 0, 0 = 60, +100 = 120
                throttleFill.current.style.backgroundColor = `hsl(${hue}, 100%, 45%, 0.7)`
            }

            // === Slider (axis 6) ===
            if (sliderHandle.current && sliderHandle.current.parentElement) {
                const box = sliderHandle.current.parentElement.getBoundingClientRect()
                const s = gp.axes[6] ?? 0
                const pos = ((s + 1) / 2) * box.width
                sliderHandle.current.style.left = `${pos}px`
            }

            // === Hat (Coolie, axis 9) ===
            if (hatBase.current && hatKnob.current) {
                const vec = povToVector(gp.axes[9])
                hatBase.current.classList.toggle("active", vec.active)
                moveHat(hatBase.current, hatKnob.current, vec.x, vec.y)
            }

            // === Buttons ===
            Object.entries(buttonMap).forEach(([i]) => {
                const el = buttons.current[i]
                if (el) {
                    el.classList.toggle("active", !!gp.buttons[i]?.pressed)
                }
            })

            raf = requestAnimationFrame(update)
        }

        update()
        return () => raf && cancelAnimationFrame(raf)
    }, [activeController, buttonMap])

    return (
        <div className="overlay hotasx">
            <div className="throttle-block">
                <div className="throttle-front">
                    {[4, 5, 6, 7].map(i => (
                        <div key={i} ref={el => buttons.current[i] = el} className="button">
                            {buttonMap[i]}
                        </div>
                    ))}
                </div>
                <div className="throttle">
                    <div className="throttle-percent">{throttlePct}%</div>
                    <div ref={throttleFill} className="throttle-fill"></div>
                </div>
                <div className="throttle-rear">
                    <div className="slider">
                        <div ref={sliderHandle} className="slider-handle"></div>
                    </div>
                    <div className="throttle-upper-buttons">
                        {[8, 9].map(i => (
                            <div key={i} ref={el => buttons.current[i] = el} className="button">
                                {buttonMap[i]}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="throttle-console">
                    {[10, 11].map(i => (
                        <div key={i} ref={el => buttons.current[i] = el} className="button">
                            {buttonMap[i]}
                        </div>
                    ))}
                </div>
            </div>

            <div className="stick-block">
                <div className="name-block">T.Flight Hotas X</div>

                <div className="stick">
                    <div ref={stickInd} className="stick-indicator"></div>
                </div>

                <div className="rudder">
                    <div ref={rudderInd} className="rudder-indicator"></div>
                </div>

                <div className="buttons">
                    <div className="hat">
                        <div ref={hatBase} className="hat-base">
                            <div ref={hatKnob} className="hat-knob"></div>
                        </div>
                    </div>

                    {[0, 1, 3].map(i => (
                        <div key={i} ref={el => buttons.current[i] = el} className="button">
                            {buttonMap[i]}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}