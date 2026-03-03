import React, {useEffect, useRef, useMemo} from "react"
import {makeActiveGamepadPicker} from "@/lib/activeGamepad"
import "@/styles/devices/PS5.css"

export default function PS5() {

    const leftStickBase = useRef(null)
    const rightStickBase = useRef(null)
    const leftStickHat = useRef(null)
    const rightStickHat = useRef(null)
    const dpad = useRef(null)
    const ltFill = useRef(null)
    const rtFill = useRef(null)
    const buttons = useRef({})

    // Standard Gamepad API mapping for PS5 DualSense (Chrome)
    const buttonMap = useMemo(() => ({
        0: "Cross",
        1: "Circle",
        2: "Square",
        3: "Triangle",
        4: "L1",
        5: "R1",
        6: "L2",
        7: "R2",
        8: "Create",
        9: "Options",
        10: "L3",
        11: "R3",
        12: "DPadUp",
        13: "DPadDown",
        14: "DPadLeft",
        15: "DPadRight",
        16: "PS",
        17: "Touchpad",
    }), [])

    const activeController = useMemo(
        () => makeActiveGamepadPicker({timeoutMs: 2000, deadzone: 0.15}),
        []
    )

    useEffect(() => {
        let raf
        const update = () => {
            const pads = navigator.getGamepads?.() || []
            const gp = activeController(pads, null)
            if (!gp) {
                raf = requestAnimationFrame(update)
                return
            }

            // Sticks
            const moveStick = (base, hat, xAxis, yAxis) => {
                if (!base || !hat) {
                    return
                }
                const box = base.getBoundingClientRect()
                const ind = hat.getBoundingClientRect()
                const rangeX = (box.width - ind.width) / 2
                const rangeY = (box.height - ind.height) / 2
                hat.style.transform =
                    `translate(calc(-50% + ${(gp.axes[xAxis] ?? 0) * rangeX}px),` +
                    ` calc(-50% + ${(gp.axes[yAxis] ?? 0) * rangeY}px))`
            }
            moveStick(leftStickBase.current, leftStickHat.current, 0, 1)
            moveStick(rightStickBase.current, rightStickHat.current, 2, 3)

            // Analog triggers (0–1)
            if (ltFill.current) {
                ltFill.current.style.height = `${(gp.buttons[6]?.value ?? 0) * 100}%`
            }
            if (rtFill.current) {
                rtFill.current.style.height = `${(gp.buttons[7]?.value ?? 0) * 100}%`
            }

            // Buttons
            Object.entries(buttonMap).forEach(([i, name]) => {
                buttons.current[name]?.classList.toggle("active", !!gp.buttons[i]?.pressed)
            })

            // D-Pad
            if (dpad.current) {
                dpad.current.classList.toggle("active-up", !!gp.buttons[12]?.pressed)
                dpad.current.classList.toggle("active-down", !!gp.buttons[13]?.pressed)
                dpad.current.classList.toggle("active-left", !!gp.buttons[14]?.pressed)
                dpad.current.classList.toggle("active-right", !!gp.buttons[15]?.pressed)
            }

            raf = requestAnimationFrame(update)
        }

        update()
        return () => raf && cancelAnimationFrame(raf)
    }, [activeController, buttonMap])

    return (
        <>
            <div className="overlay ps5">
                <div className="controller-body">

                    {/* L1 / L2 */}
                    <div className="top-left">
                        <div ref={el => buttons.current.L1 = el} className="bumper l1">L1</div>
                        <div ref={el => buttons.current.L2 = el} className="trigger l2">
                            <div ref={ltFill} className="trig-fill"/>
                            <span>L2</span>
                        </div>
                    </div>

                    {/* R1 / R2 */}
                    <div className="top-right">
                        <div ref={el => buttons.current.R1 = el} className="bumper r1">R1</div>
                        <div ref={el => buttons.current.R2 = el} className="trigger r2">
                            <div ref={rtFill} className="trig-fill"/>
                            <span>R2</span>
                        </div>
                    </div>

                    {/* Left stick – upper-left (PS5 layout) */}
                    <div className="left-stick">
                        {/* dual ref: stick movement + L3 click */}
                        <div ref={el => {
                            leftStickBase.current = el;
                            buttons.current.L3 = el
                        }}
                             className="stick-base">
                            <div ref={leftStickHat} className="stick-hat"/>
                        </div>
                    </div>

                    {/* D-Pad – lower-left (PS5 layout) */}
                    <div ref={dpad} className="dpad">
                        <span className="up"/>
                        <span className="down"/>
                        <span className="left"/>
                        <span className="right"/>
                    </div>

                    {/* Touchpad + center buttons */}
                    <div className="center">
                        <div ref={el => buttons.current.Touchpad = el} className="touchpad"/>
                        <div className="center-row">
                            <div ref={el => buttons.current.Create = el} className="small-btn">✦</div>
                            <div ref={el => buttons.current.PS = el} className="ps-btn">PS</div>
                            <div ref={el => buttons.current.Options = el} className="small-btn">≡</div>
                        </div>
                    </div>

                    {/* Face buttons – upper-right (PS5 layout) */}
                    <div className="face">
                        <div ref={el => buttons.current.Triangle = el} className="btn triangle">
                            <svg viewBox="-18 -16 140 140" role="img" aria-hidden="true">
                                <polygon points="50,12 88,88 12,88" fill="none" stroke="currentColor"
                                         strokeWidth="10" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <div ref={el => buttons.current.Circle = el} className="btn circle">
                            <svg viewBox="-20 -20 140 140" role="img" aria-hidden="true">
                                <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="10"/>
                            </svg>
                        </div>
                        <div ref={el => buttons.current.Cross = el} className="btn cross">
                            <svg viewBox="-20 -20 140 140" role="img" aria-hidden="true">
                                <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="10"
                                      strokeLinecap="round"/>
                                <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="10"
                                      strokeLinecap="round"/>
                            </svg>
                        </div>
                        <div ref={el => buttons.current.Square = el} className="btn square">
                            <svg viewBox="-20 -20 140 140" role="img" aria-hidden="true">
                                <rect x="18" y="18" width="64" height="64" rx="8" ry="8" fill="none"
                                      stroke="currentColor" strokeWidth="10"/>
                            </svg>
                        </div>
                    </div>

                    {/* Right stick – lower-right (PS5 layout) */}
                    <div className="right-stick">
                        {/* dual ref: stick movement + R3 click */}
                        <div ref={el => {
                            rightStickBase.current = el;
                            buttons.current.R3 = el
                        }}
                             className="stick-base">
                            <div ref={rightStickHat} className="stick-hat"/>
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}