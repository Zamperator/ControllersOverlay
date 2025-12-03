import React, {useEffect, useRef, useMemo, useState} from "react"
import {makeActiveGamepadPicker} from "@/lib/activeGamepad";
import "@/styles/devices/HotasX.css"

export default function HotasX() {

    const stickInd = useRef(null)
    const rudderInd = useRef(null)
    const throttleFill = useRef(null)
    const sliderHandle = useRef(null)
    const hatArrow = useRef(null)
    const buttons = useRef({})

    const [throttlePct, setThrottlePct] = useState(0)
    const lastHatAngle = useRef(null)

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
        let raf;

        function update() {
            const pads = navigator.getGamepads?.() || [];
            const gp = activeController(pads, null)
            if (!gp) {
                raf = requestAnimationFrame(update);
                return;
            }

            // === Stick (X/Y) ===
            if (stickInd.current && stickInd.current.parentElement) {
                const box = stickInd.current.parentElement.getBoundingClientRect()
                const ind = stickInd.current.getBoundingClientRect()
                const rangeX = (box.width - ind.width) / 2
                const rangeY = (box.height - ind.height) / 2
                const x = gp.axes[0]
                const y = gp.axes[1]
                stickInd.current.style.transform = `translate(${x * rangeX}px, ${y * rangeY}px)`
            }

            // === Rudder (axis 5) ===
            if (rudderInd.current && rudderInd.current.parentElement) {
                const box = rudderInd.current.parentElement.getBoundingClientRect()
                const r = gp.axes[5] // –1 … +1
                const pos = ((r + 1) / 2) * box.width
                rudderInd.current.style.left = `${pos}px`
            }

            // === Throttle (axis 2) ===
            if (throttleFill.current) {
                const z = -gp.axes[2]              // –1 … +1
                const pct = Math.round(z * 100)   // –100 … +100
                setThrottlePct(pct)

                // Height (inverted to match physical movement)
                const heightPct = (pct + 100) / 200 * 100
                throttleFill.current.style.height = `${heightPct}%`

                // Color (Hue 0 = Rot → 120 = Grün)
                const hue = (pct + 100) * 0.6     // -100 = 0, 0 = 60, +100 = 120
                throttleFill.current.style.backgroundColor = `hsl(${hue}, 100%, 45%, 0.7)`

                // Text color adjustment
                /*const throttlePercentEl = throttleFill.current.parentElement.querySelector(".throttle-percent")
                if (throttlePercentEl) {
                    if (pct > -20 && pct < 20) {
                        throttlePercentEl.style.color = "#111"
                        throttlePercentEl.style.textShadow = "0 1px 2px #fff"
                    } else {
                        throttlePercentEl.style.color = "#fff"
                        throttlePercentEl.style.textShadow = "0 1px 2px #000"
                    }
                }*/
            }

            // === Slider (axis 6) ===
            if (sliderHandle.current && sliderHandle.current.parentElement) {
                const box = sliderHandle.current.parentElement.getBoundingClientRect()
                const s = gp.axes[6]
                const pos = ((s + 1) / 2) * box.width
                sliderHandle.current.style.left = `${pos}px`
            }

            // === Hat (Coolie, Axis 9) ===
            if (hatArrow.current) {
                const pov = gp.axes[9]
                let angle = null

                // Mapping Axis9 → Angle
                if (Math.abs(pov - (-1.0)) < 0.05) {
                    angle = 0
                }
                else if (Math.abs(pov - (-0.714)) < 0.05) {
                    angle = 45
                }
                else if (Math.abs(pov - (-0.428)) < 0.05) {
                    angle = 90
                }
                else if (Math.abs(pov - (-0.143)) < 0.05) {
                    angle = 135
                }
                else if (Math.abs(pov - (0.143)) < 0.05) {
                    angle = 180
                }
                else if (Math.abs(pov - (0.428)) < 0.05) {
                    angle = 225
                }
                else if (Math.abs(pov - (0.714)) < 0.05) {
                    angle = 270
                }
                else if (Math.abs(pov - (1.0)) < 0.05) {
                    angle = 315
                }

                if (angle !== null) {
                    if (lastHatAngle.current !== null) {
                        const diff = angle - lastHatAngle.current

                        // Jump over 360° → correct
                        if (diff > 180) {
                            angle -= 360
                        }
                        else if (diff < -180) {
                            angle += 360
                        }
                    }

                    lastHatAngle.current = angle % 360

                    hatArrow.current.classList.add("active")
                    hatArrow.current.style.transform =
                        `translate(-50%, -50%) rotate(${lastHatAngle.current}deg)`
                }
                else {
                    hatArrow.current.classList.remove("active")
                    lastHatAngle.current = null
                }
            }

            // === Buttons ===
            Object.entries(buttonMap).forEach(([i]) => {
                const el = buttons.current[i]
                if (el) {
                    el.classList.toggle("active", gp.buttons[i]?.pressed)
                }
            })

            raf = requestAnimationFrame(update);
        }

        update()

        return () => cancelAnimationFrame(raf);

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
                        <div ref={hatArrow} className="hat-arrow"></div>
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
