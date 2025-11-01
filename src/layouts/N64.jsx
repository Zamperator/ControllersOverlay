import React, {useEffect, useMemo, useRef} from "react"
import {makeActiveGamepadPicker} from "@/lib/activeGamepad";
import "@/styles/devices/N64.css"

export default function N64() {
    const dpad = useRef(null)
    const stickBase = useRef(null)
    const stickHat = useRef(null)
    const buttons = useRef({})

    // Button-Index-Mapping
    const buttonMap = useMemo(() => ({
        0: "cUp",
        1: "cRight",
        2: "cDown",
        3: "cLeft",
        4: "L",
        5: "R",
        6: "A",
        7: "Z",
        8: "B",
        9: "Start",
    }), [])

    const activeController = useMemo(() => makeActiveGamepadPicker({timeoutMs: 2000, deadzone: .15}), [])

    useEffect(() => {
        let raf

        function setHat(x, y) {
            if (!stickHat.current || !stickBase.current) {
                return
            }
            const base = stickBase.current.getBoundingClientRect()
            const hat = stickHat.current.getBoundingClientRect()
            const rx = (base.width - hat.width) / 2
            const ry = (base.height - hat.height) / 2
            stickHat.current.style.transform =
                `translate(calc(-50% + ${x * rx}px), calc(-50% + ${y * ry}px))`
        }

        const near = (a, b, eps = 0.08) => Math.abs(a - b) <= eps

        function update() {
            const pads = navigator.getGamepads?.() || [];
            const gp = activeController(pads, null)
            if (!gp) {
                raf = requestAnimationFrame(update);
                return;
            }

            // Stick (axes 0/1)
            setHat(gp.axes[0] ?? 0, gp.axes[1] ?? 0)

            // D-Pad (Axis 9 Values; incl. Diagonals)
            if (dpad.current) {
                const v = gp.axes[9]
                const up = near(v, -1.000)
                const upR = near(v, -0.714)
                const right = near(v, -0.428)
                const downR = near(v, -0.143)
                const down = near(v, 0.143)
                const downL = near(v, 0.428)
                const left = near(v, 0.714)
                const upL = near(v, 1.000)

                dpad.current.classList.toggle("active-up", up || upR || upL)
                dpad.current.classList.toggle("active-right", right || upR || downR)
                dpad.current.classList.toggle("active-down", down || downR || downL)
                dpad.current.classList.toggle("active-left", left || upL || downL)
            }

            // Buttons
            Object.entries(buttonMap).forEach(([idx, name]) => {
                const el = buttons.current[name]
                if (!el) {
                    return
                }
                el.classList.toggle("active", !!gp.buttons[idx]?.pressed)
            })

            raf = requestAnimationFrame(update)
        }

        update()
        return () => cancelAnimationFrame(raf)
    }, [activeController, buttonMap])

    return (
        <div className="overlay n64">
            <div className="controller-body">

                {/* D-Pad */}
                <div ref={dpad} className="dpad">
                    <span className="up"/>
                    <span className="right"/>
                    <span className="down"/>
                    <span className="left"/>
                </div>

                {/* Analog-Stick */}
                <div ref={stickBase} className="stick-base">
                    <div ref={stickHat} className="stick-hat"/>
                </div>

                {/* A / B */}
                <div ref={el => (buttons.current.B = el)} className="btn b">B</div>
                <div ref={el => (buttons.current.A = el)} className="btn a">A</div>

                {/* C-Cluster */}
                <div ref={el => (buttons.current.cUp = el)} className="btn c cup">C</div>
                <div ref={el => (buttons.current.cRight = el)} className="btn c cright">C</div>
                <div ref={el => (buttons.current.cDown = el)} className="btn c cdown">C</div>
                <div ref={el => (buttons.current.cLeft = el)} className="btn c cleft">C</div>

                {/* Schultertasten & Z */}
                <div ref={el => (buttons.current.L = el)} className="shoulder l"></div>
                <div ref={el => (buttons.current.R = el)} className="shoulder r"></div>
                <div ref={el => (buttons.current.Z = el)} className="trigger-z">Z</div>

                {/* START */}
                <div ref={el => (buttons.current.Start = el)} className="start">START</div>

            </div>
        </div>
    )
}
