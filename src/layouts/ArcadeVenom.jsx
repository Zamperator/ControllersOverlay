import React, { useEffect, useMemo, useRef } from "react"
import {makeActiveGamepadPicker} from "@/lib/activeGamepad";
import "@/styles/devices/ArcadeVenom.css"

export default function ArcadeVenom() {
    const stickBall = useRef(null)
    const buttons = useRef({})

    const buttonMap = useMemo(() => ({
        0: "square",
        1: "x",
        2: "circle",
        3: "triangle",
        4: "L1",
        5: "R1",
        6: "L2",
        7: "R2",
        8: "SE",        // Select
        9: "ST",        // Start
        12: "PSButton"  // big centered Playstation button
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

            // === Stick Movement (Ball) ===
            if (stickBall.current) {
                const x = gp.axes[0]
                const y = gp.axes[1]
                const magnitude = Math.sqrt(x * x + y * y)
                const maxRadius = 6

                if (magnitude > 0.1) {
                    const clamped = Math.min(magnitude, 1)
                    const moveX = x * maxRadius * clamped
                    const moveY = y * maxRadius * clamped

                    stickBall.current.style.transform =
                        `translate(calc(-50% + ${moveX}vmin), calc(-50% + ${moveY}vmin))`

                    const light = getComputedStyle(document.documentElement)
                        .getPropertyValue("--ball-light").trim() || "#ff4040"
                    const dark = getComputedStyle(document.documentElement)
                        .getPropertyValue("--ball-dark").trim() || "#600000"
                    const shadow = getComputedStyle(document.documentElement)
                        .getPropertyValue("--ball-shadow-glow").trim() || "rgba(255,0,0,0.5)"

                    const lightX = 50 - moveX * 1.5
                    const lightY = 50 - moveY * 1.5

                    stickBall.current.style.background =
                        `radial-gradient(circle at ${lightX}% ${lightY}%, ${light}, ${dark})`
                    stickBall.current.style.boxShadow =
                        `inset 0 0 1.2vmin var(--ball-shadow-inset, #300),
                         ${-moveX * 0.2}vmin ${-moveY * 0.2}vmin 1.2vmin ${shadow}`
                } else {
                    stickBall.current.style.transform = "translate(-50%, -50%)"
                    stickBall.current.style.background =
                        "radial-gradient(circle at 30% 30%, var(--ball-light, #ff3030), var(--ball-dark, #800000))"
                    stickBall.current.style.boxShadow =
                        "inset 0 0 1vmin var(--ball-shadow-inset, #500), 0 0 1vmin var(--ball-shadow-glow, #f00)"
                }
            }

            // === Buttons ===
            Object.entries(buttons.current).forEach(([i, el]) => {
                if (el) {
                    const pressed = gp.buttons[i]?.pressed || false
                    el.classList.toggle("active", pressed)
                }
            })

            raf = requestAnimationFrame(update);
        }

        update()

        return () => cancelAnimationFrame(raf);

    }, [activeController, buttonMap])

    return (
        <div className="layout arcadevenom">
            <div className="left">
                <div className="stick">
                    <div ref={stickBall} className="stick-ball"></div>
                </div>
            </div>

            <div className="right">
                <div className="buttons-grid">
                    {/* Main buttons */}
                    <div className="row row-top">
                        <div ref={el => buttons.current[0] = el} className="button square">▢</div>
                        <div ref={el => buttons.current[3] = el} className="button triangle">Δ</div>
                        <div ref={el => buttons.current[5] = el} className="button r1">R1</div>
                        <div ref={el => buttons.current[4] = el} className="button l1">L1</div>
                    </div>

                    <div className="row row-bottom">
                        <div ref={el => buttons.current[1] = el} className="button cross">✕</div>
                        <div ref={el => buttons.current[2] = el} className="button circle">◯</div>
                        <div ref={el => buttons.current[7] = el} className="button r2">R2</div>
                        <div ref={el => buttons.current[6] = el} className="button l2">L2</div>
                    </div>

                    {/* START/SELECT */}
                    <div className="row row-system">
                        <div ref={el => buttons.current[8] = el} className="button small se">SELECT</div>
                        <div ref={el => buttons.current[9] = el} className="button small st">START</div>
                    </div>

                    {/* PlayStation-Button */}
                    <div
                        ref={el => buttons.current[12] = el}
                        className="button ps-button"
                    >
                    </div>
                </div>
            </div>
        </div>
    )
}
