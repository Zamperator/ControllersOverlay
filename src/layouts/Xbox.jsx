import React, {useEffect, useRef, useMemo} from "react"
import {makeActiveGamepadPicker} from "@/lib/activeGamepad";
import "@/styles/devices/Xbox.css"

export default function Xbox() {

    const leftStickBase = useRef(null)
    const rightStickBase = useRef(null)
    const leftStickHat = useRef(null)
    const rightStickHat = useRef(null)
    const dpad = useRef(null)
    const buttons = useRef({})

    const buttonMap = useMemo(() => ({
        0: "A",
        1: "B",
        2: "X",
        3: "Y",
        4: "LB",
        5: "RB",
        6: "LT",
        7: "RT",
        8: "Back",
        9: "Start",
        10: "LS",
        11: "RS",
        12: "DPadUp",
        13: "DPadDown",
        14: "DPadLeft",
        15: "DPadRight",
        16: "Xbox"
    }), [])

    const activeController = useMemo(() => makeActiveGamepadPicker({timeoutMs: 2000, deadzone: .15}), [])

    useEffect(() => {
        let raf
        const update = () => {
            const pads = navigator.getGamepads?.() || [];
            const gp = activeController(pads, null)
            if (!gp) {
                raf = requestAnimationFrame(update);
                return;
            }

            // === Sticks ===
            const moveStick = (base, hat, xAxis, yAxis) => {
                if (!base || !hat) {
                    return
                }
                const box = base.getBoundingClientRect()
                const ind = hat.getBoundingClientRect()
                const rangeX = (box.width - ind.width) / 2
                const rangeY = (box.height - ind.height) / 2
                const x = gp.axes[xAxis] ?? 0
                const y = gp.axes[yAxis] ?? 0
                hat.style.transform = `translate(calc(-50% + ${x * rangeX}px), calc(-50% + ${y * rangeY}px))`
            }
            moveStick(leftStickBase.current, leftStickHat.current, 0, 1)
            moveStick(rightStickBase.current, rightStickHat.current, 2, 3)

            // === Buttons (incl. Trigger) ===
            Object.entries(buttonMap).forEach(([i, name]) => {
                const el = buttons.current[name]
                if (el) {
                    el.classList.toggle("active", !!gp.buttons[i]?.pressed)
                }
            })

            // === D-Pad ===
            if (dpad.current) {
                dpad.current.classList.toggle("active-up", gp.buttons[12]?.pressed)
                dpad.current.classList.toggle("active-down", gp.buttons[13]?.pressed)
                dpad.current.classList.toggle("active-left", gp.buttons[14]?.pressed)
                dpad.current.classList.toggle("active-right", gp.buttons[15]?.pressed)
            }

            raf = requestAnimationFrame(update)
        }

        update()
        return () => raf && cancelAnimationFrame(raf)
    }, [activeController, buttonMap])

    return (
        <div className="overlay xbox">
            <div className="controller-body">

                {/* Bumper + Trigger */}
                <div className="top-left">
                    <div ref={el => buttons.current.LB = el} className="bumper lb">LB</div>
                    <div ref={el => buttons.current.LT = el} className="trigger lt">LT</div>
                </div>
                <div className="top-right">
                    <div ref={el => buttons.current.RB = el} className="bumper rb">RB</div>
                    <div ref={el => buttons.current.RT = el} className="trigger rt">RT</div>
                </div>

                {/* Center Buttons */}
                <div className="center">
                    <div ref={el => buttons.current.Back = el} className="small-btn">⧉</div>
                    <div ref={el => buttons.current.Xbox = el} className="xbox-btn">
                        <svg viewBox="0 0 76 76" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path
                                d="M19,10.2917C27.3776,9.99247 34.8506,14.4426 38,16.6332C41.1494,14.4426 48.6224,9.99247 57,10.2917
               C60.1667,11.4792 60.5625,12.2709 60.5625,12.2709C60.5625,12.2709 51.8542,15.0417 45.5208,22.9583
               C53.8333,33.6458 65.3125,48.2917 63.7292,60.9583C55.4167,46.3125 45.8739,35.2702 38,30.6145
               C30.1261,35.2702 20.5833,46.3125 12.2708,60.9583C10.6875,48.2917 22.1667,33.6458 30.4792,22.9583
               C24.1458,15.0417 15.4375,12.2709 15.4375,12.2709C15.4375,12.2709 15.8333,11.4792 19,10.2917Z"
                            />
                        </svg>
                    </div>
                    <div ref={el => buttons.current.Start = el} className="small-btn">≡</div>
                </div>

                {/* Sticks */}
                <div className="left-stick">
                    <div ref={leftStickBase} className="stick-base">
                        <div ref={leftStickHat} className="stick-hat"/>
                    </div>
                </div>
                <div className="right-stick">
                    <div ref={rightStickBase} className="stick-base">
                        <div ref={rightStickHat} className="stick-hat"/>
                    </div>
                </div>

                {/* D-Pad */}
                <div ref={dpad} className="dpad">
                    <span className="up"></span>
                    <span className="down"></span>
                    <span className="left"></span>
                    <span className="right"></span>
                </div>

                {/* Face Buttons */}
                <div className="face">
                    <div ref={el => buttons.current.Y = el} className="btn y">Y</div>
                    <div ref={el => buttons.current.B = el} className="btn b">B</div>
                    <div ref={el => buttons.current.A = el} className="btn a">A</div>
                    <div ref={el => buttons.current.X = el} className="btn x">X</div>
                </div>
            </div>
        </div>
    )
}
