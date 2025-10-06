import React, {useEffect, useRef, useMemo} from "react"
import "../styles/devices/SNES.css"

export default function SNES() {
    const dpad = useRef(null)
    const buttons = useRef({})

    const buttonMap = useMemo(() => ({
        0: "B",
        1: "A",
        2: "Y",
        3: "X",
        4: "L",
        5: "R",
        8: "Select",
        9: "Start",
    }), [])

    useEffect(() => {
        let raf
        const update = () => {
            const pads = navigator.getGamepads?.() || []
            const gp = Array.from(pads).find(p => p && /Vendor:\s*0583\s*Product:\s*2060/i.test(p.id))
            if (!gp) return (raf = requestAnimationFrame(update))

            // === D-Pad über Achsen ===
            if (dpad.current) {
                const x = gp.axes[0] ?? 0
                const y = gp.axes[1] ?? 0

                dpad.current.classList.toggle("active-left",  x < -0.5)
                dpad.current.classList.toggle("active-right", x >  0.5)
                dpad.current.classList.toggle("active-up",    y < -0.5)
                dpad.current.classList.toggle("active-down",  y >  0.5)
            }

            // === Buttons ===
            Object.entries(buttonMap).forEach(([index, name]) => {
                const el = buttons.current[name]
                if (el) el.classList.toggle("active", !!gp.buttons[index]?.pressed)
            })

            raf = requestAnimationFrame(update)
        }
        update()
        return () => cancelAnimationFrame(raf)
    }, [buttonMap])

    return (
        <div className="overlay snes">
            <div className="controller-body">
                <div ref={dpad} className="dpad">
                    <span className="up"></span>
                    <span className="down"></span>
                    <span className="left"></span>
                    <span className="right"></span>
                </div>

                <div className="face-buttons">
                    <div ref={el => buttons.current.Y = el} className="btn y">Y</div>
                    <div ref={el => buttons.current.X = el} className="btn x">X</div>
                    <div ref={el => buttons.current.B = el} className="btn b">B</div>
                    <div ref={el => buttons.current.A = el} className="btn a">A</div>
                </div>

                <div className="center-buttons">
                    <div ref={el => buttons.current.Select = el} className="btn small select">Select</div>
                    <div ref={el => buttons.current.Start = el} className="btn small start">Start</div>
                </div>

                <div className="shoulders">
                    <div ref={el => buttons.current.L = el} className="btn shoulder l">L</div>
                    <div ref={el => buttons.current.R = el} className="btn shoulder r">R</div>
                </div>
            </div>
        </div>
    )
}