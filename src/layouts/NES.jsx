import React, { useEffect, useRef, useMemo } from "react"
import "../styles/devices/NES.css"

export default function NES() {
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

            if (dpad.current) {
                const x = gp.axes[0] ?? 0
                const y = gp.axes[1] ?? 0
                dpad.current.classList.toggle("active-left",  x < -0.5)
                dpad.current.classList.toggle("active-right", x >  0.5)
                dpad.current.classList.toggle("active-up",    y < -0.5)
                dpad.current.classList.toggle("active-down",  y >  0.5)
            }

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
        <div className="overlay nes">
            <div className="controller-body">
                {/* D-Pad */}
                <div className="dpad-lobe">
                    <div ref={dpad} className="dpad-ring">
                        <div className="dir-l-r"></div>
                        <div className="dpad-hub"></div>
                        <div className="hub"></div>

                        <div className="arrow-r"></div>
                        <div className="arrow-l"></div>
                        <div className="arrow-u"></div>
                        <div className="arrow-d"></div>

                        <div className="dir-u-d"></div>

                        {/* unsichtbare Overlays für Active-Effekt */}
                        <span className="hit up"></span>
                        <span className="hit down"></span>
                        <span className="hit left"></span>
                        <span className="hit right"></span>
                    </div>
                </div>

                {/* Rote Frontplatten-Schrift */}
                <div className="select-start-labels" aria-hidden="true">
                    <span className="label-select">SELECT</span>
                    <span className="label-start">START</span>
                </div>

                {/* Select/Start – Taster mit eigener Box + Unterleiste */}
                <div className="center-buttons">
                    <div ref={el => buttons.current.Select = el} className="btn small select" aria-label="Select"/>
                    <div ref={el => buttons.current.Start = el} className="btn small start" aria-label="Start"/>
                </div>

                {/* A/B */}
                <div className="face-buttons">
                    <div className={"button-box"}>
                        <div ref={el => buttons.current.Y = el} className="btn b" aria-label="B"/>
                    </div>
                    <div className={"button-box"}>
                        <div ref={el => buttons.current.B = el} className="btn a" aria-label="A"/>
                    </div>
                </div>
            </div>
        </div>
    )
}
