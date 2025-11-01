import React, {useEffect, useRef, useMemo} from "react"
import {makeActiveGamepadPicker} from "@/lib/activeGamepad";
import "@/styles/devices/Genesis.css"

export default function Genesis() {
    const dpad = useRef(null)
    const buttons = useRef({})

    // Button mapping: USB SEGA 6-Button Controller
    const buttonMap = useMemo(() => ({
        0: "B",
        1: "A",
        4: "C",
        3: "X",
        2: "Y",
        5: "Z",
        8: "Mode",
        9: "Start",
        12: "dpadUp",
        13: "dpadDown",
        14: "dpadLeft",
        15: "dpadRight",
    }), [])

    const activeController = useMemo(() => makeActiveGamepadPicker({timeoutMs: 2000, deadzone: .15}), [])

    useEffect(() => {
        let raf

        function update() {
            const pads = navigator.getGamepads?.() || [];
            const gp = activeController(pads, null)
            if (!gp) {
                raf = requestAnimationFrame(update);
                return;
            }

            // === BUTTONS ===
            Object.entries(buttonMap).forEach(([index, name]) => {
                const el = buttons.current[name]
                if (!el) {
                    return
                }
                const pressed = !!gp.buttons[index]?.pressed
                el.classList.toggle("active", pressed)
            })

            // === DPAD ===
            if (dpad.current) {
                dpad.current.classList.toggle("active-up", !!gp.buttons[12]?.pressed)
                dpad.current.classList.toggle("active-down", !!gp.buttons[13]?.pressed)
                dpad.current.classList.toggle("active-left", !!gp.buttons[14]?.pressed)
                dpad.current.classList.toggle("active-right", !!gp.buttons[15]?.pressed)
            }

            raf = requestAnimationFrame(update)
        }

        update()
        return () => cancelAnimationFrame(raf)
    }, [activeController, buttonMap])

    return (
        <div className="overlay genesis">
            <div className="controller-body">

                {/* === D-PAD === */}
                <div ref={dpad} className="dpad">
                    <span className="up"></span>
                    <span className="down"></span>
                    <span className="left"></span>
                    <span className="right"></span>
                </div>

                {/* === START BUTTON === */}
                <div ref={el => buttons.current.Start = el} className="start-btn">
                    <div className={"start-label"}>START</div>
                </div>

                {/* === FACE BUTTONS === */}
                <div className="face-buttons">
                    <div className="row top">
                        <div ref={el => buttons.current.X = el} className="btn x">X</div>
                        <div ref={el => buttons.current.Y = el} className="btn y">Y</div>
                        <div ref={el => buttons.current.Z = el} className="btn z">Z</div>
                    </div>
                    <div className="row bottom">
                        <div ref={el => buttons.current.A = el} className="btn a">A</div>
                        <div ref={el => buttons.current.B = el} className="btn b">B</div>
                        <div ref={el => buttons.current.C = el} className="btn c">C</div>
                    </div>
                </div>

                {/* === MODE BUTTON === */}
                <div className="extra-buttons">
                    <div ref={el => buttons.current.Mode = el} className="extra-btn"></div>
                    <div className={"extra-label"}>MODE</div>
                </div>

            </div>
        </div>
    )
}
