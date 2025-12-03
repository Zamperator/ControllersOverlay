import React, {useEffect, useRef, useMemo} from "react"
import {makeActiveGamepadPicker} from "@/lib/activeGamepad";
import "@/styles/devices/GenesisClassic.css"

export default function GenesisClassic() {
    const dpad = useRef(null)
    const buttons = useRef({})

    // Button mapping: USB SEGA 6-Button Controller
    const buttonMap = useMemo(() => ({
        0: "B",
        1: "A",
        4: "C",
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
        <div className="overlay genesis-classic">
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
                    <div className="row">
                        <div ref={el => buttons.current.A = el} className="btn a">A</div>
                        <div ref={el => buttons.current.B = el} className="btn b">B</div>
                        <div ref={el => buttons.current.C = el} className="btn c">C</div>
                    </div>
                </div>

            </div>
        </div>
    )
}
