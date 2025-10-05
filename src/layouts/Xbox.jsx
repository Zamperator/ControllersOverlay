import React, { useEffect, useRef, useMemo } from "react"
import "../styles/devices/Xbox.css"

export default function Xbox() {
    const leftStickHat = useRef(null)
    const rightStickHat = useRef(null)
    const leftStickBase = useRef(null)
    const rightStickBase = useRef(null)
    const triggers = useRef({ LT: null, RT: null })
    const buttons = useRef({})
    const dpad = useRef(null)

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

    useEffect(() => {
        let raf = null

        function normalizeAxisTo01(a) {
            // axes can be -1..1 (stick) or 0..1 (some triggers). Convert to 0..1 robustly.
            if (a === undefined || a === null) return 0
            if (a >= -1 && a <= 1) {
                // if it's near -1..1 assume center -> (-1..1) => (0..1)
                return (a + 1) / 2
            }
            return 0
        }

        function update() {
            const pads = navigator.getGamepads ? navigator.getGamepads() : []
            const gp = Array.from(pads).find(p => p && /xbox|microsoft|xinput/i.test(p.id))
            if (!gp) {
                raf = requestAnimationFrame(update)
                return
            }

            // ---------- LEFT STICK (axes 0,1) ----------
            if (leftStickHat.current && leftStickBase.current) {
                try {
                    const baseRect = leftStickBase.current.getBoundingClientRect()
                    const hatRect = leftStickHat.current.getBoundingClientRect()
                    const rangeX = (baseRect.width - hatRect.width) / 2
                    const rangeY = (baseRect.height - hatRect.height) / 2
                    const x = gp.axes[0] ?? 0
                    const y = gp.axes[1] ?? 0
                    leftStickHat.current.style.transform =
                        `translate(calc(-50% + ${x * rangeX}px), calc(-50% + ${y * rangeY}px))`
                } catch (e) {
                    // defensive: if element unmounted or measurement failed
                }
            }

            // ---------- RIGHT STICK (axes 2,3) ----------
            if (rightStickHat.current && rightStickBase.current) {
                try {
                    const baseRect = rightStickBase.current.getBoundingClientRect()
                    const hatRect = rightStickHat.current.getBoundingClientRect()
                    const rangeX = (baseRect.width - hatRect.width) / 2
                    const rangeY = (baseRect.height - hatRect.height) / 2
                    const x = gp.axes[2] ?? 0
                    const y = gp.axes[3] ?? 0
                    rightStickHat.current.style.transform =
                        `translate(calc(-50% + ${x * rangeX}px), calc(-50% + ${y * rangeY}px))`
                } catch (e) {}
            }

            // ---------- TRIGGERS (analog axes) ----------
            // Many Xbox controllers expose triggers as axes[4] (LT) & axes[5] (RT) possibly in -1..1 range.
            if (triggers.current.LT) {
                const raw = gp.axes[4]
                const val = normalizeAxisTo01(raw) // 0..1
                triggers.current.LT.style.setProperty("--fill", `${Math.round(val * 100)}%`)
            }
            if (triggers.current.RT) {
                const raw = gp.axes[5]
                const val = normalizeAxisTo01(raw)
                triggers.current.RT.style.setProperty("--fill", `${Math.round(val * 100)}%`)
            }

            // ---------- BUTTONS ----------
            Object.entries(buttonMap).forEach(([i, name]) => {
                const el = buttons.current[name]
                if (!el) return
                const pressed = !!gp.buttons[i]?.pressed
                el.classList.toggle("active", pressed)
            })

            // ---------- DPAD (treat as digital buttons 12..15) ----------
            if (dpad.current) {
                dpad.current.classList.toggle("active-up", !!gp.buttons[12]?.pressed)
                dpad.current.classList.toggle("active-down", !!gp.buttons[13]?.pressed)
                dpad.current.classList.toggle("active-left", !!gp.buttons[14]?.pressed)
                dpad.current.classList.toggle("active-right", !!gp.buttons[15]?.pressed)
            }

            raf = requestAnimationFrame(update)
        }

        update()

        return () => {
            if (raf) cancelAnimationFrame(raf)
        }
    }, [buttonMap])

    return (
        <div className="overlay xbox">
            <div className="controller-body">

                {/* BUMPERS (LB / RB) */}
                <div className="bumpers">
                    <div ref={el => buttons.current.LB = el} className="bumper">LB</div>
                    <div ref={el => buttons.current.RB = el} className="bumper">RB</div>
                </div>

                {/* TRIGGERS (LT / RT) */}
                <div className="triggers">
                    <div ref={el => triggers.current.LT = el} className="trigger lt"></div>
                    <div ref={el => triggers.current.RT = el} className="trigger rt"></div>
                </div>

                {/* CENTER BUTTONS */}
                <div className="center-buttons">
                    <div ref={el => buttons.current.Back = el} className="button button-back">Back</div>
                    <div ref={el => buttons.current.Xbox = el} className="button button-xbox"></div>
                    <div ref={el => buttons.current.Start = el} className="button button-start">Start</div>
                </div>

                {/* LEFT STICK */}
                <div className="left-stick">
                    <div ref={leftStickBase} className="stick-base">
                        <div ref={leftStickHat} className="stick-hat"></div>
                    </div>
                </div>

                {/* RIGHT STICK */}
                <div className="right-stick">
                    <div ref={rightStickBase} className="stick-base">
                        <div ref={rightStickHat} className="stick-hat"></div>
                    </div>
                </div>

                {/* D-PAD (single cross element) */}
                <div ref={dpad} className="dpad" aria-hidden="true"></div>

                {/* FACE BUTTONS (A,B,X,Y) — classes match buttonMap names */}
                <div className="buttons">
                    <div ref={el => buttons.current.X = el} className="button button-x">X</div>
                    <div ref={el => buttons.current.Y = el} className="button button-y">Y</div>
                    <div ref={el => buttons.current.A = el} className="button button-a">A</div>
                    <div ref={el => buttons.current.B = el} className="button button-b">B</div>
                </div>

            </div>
        </div>
    )
}
