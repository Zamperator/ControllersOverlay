import React, {useEffect, useLayoutEffect, useMemo, useRef} from "react"
import "../styles/devices/NES.css"
import {controllerSetups} from "@/config/config";

export default function NES() {
    const dpad = useRef(null)        // bleibt auf .dpad-ring
    const dpadWrap = useRef(null)    // neu: wrapper
    const dpadLobe = useRef(null)    // neu: lobe (Basis 250x250 fürs Scaling)
    const buttons = useRef({})

    const buttonMap = useMemo(() => ({
        0: "B",
        1: "A",
        2: "Y",
        3: "X",
        4: "L",
        5: "R",
        8: "Select",
        9: "Start"
    }), [])

    const setup = controllerSetups('nes')

    // === Pixel->Wrapper-Scaling: skaliert die Lobe proportional in die vmin-Box ===
    useLayoutEffect(() => {

        if (!dpadWrap.current || !dpadLobe.current) {
            return
        }

        const BASE_W = 250
        const BASE_H = 250

        let lastW = -1
        let lastH = -1
        let raf = 0

        const applyScale = () => {
            const wrap = dpadWrap.current
            const lobe = dpadLobe.current
            if (!wrap || !lobe) {
                return
            }

            const w = wrap.clientWidth
            const h = wrap.clientHeight
            if (w === lastW && h === lastH) {
                return
            }
            lastW = w
            lastH = h

            const s = Math.min(w / BASE_W, h / BASE_H)
            const dx = (w - BASE_W * s) / 2
            const dy = (h - BASE_H * s) / 2

            lobe.style.transformOrigin = 'top left'
            lobe.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`
        }

        const ro = new ResizeObserver(() => {
            if (raf) {
                cancelAnimationFrame(raf)
            }
            raf = requestAnimationFrame(applyScale)
        })

        ro.observe(dpadWrap.current)
        applyScale()

        return () => {
            if (raf) {
                cancelAnimationFrame(raf)
            }
            ro.disconnect()
        }
    }, [])

    useEffect(() => {
        let raf
        const update = () => {
            const pads = navigator.getGamepads?.() || []
            const gp = Array.from(pads).find(p => p && setup.getRegEx().test(p.id))
            if (!gp) {
                return (raf = requestAnimationFrame(update))
            }

            if (dpad.current) {
                const x = gp.axes[0] ?? 0
                const y = gp.axes[1] ?? 0
                dpad.current.classList.toggle("active-left", x < -0.5)
                dpad.current.classList.toggle("active-right", x > 0.5)
                dpad.current.classList.toggle("active-up", y < -0.5)
                dpad.current.classList.toggle("active-down", y > 0.5)
            }

            Object.entries(buttonMap).forEach(([index, name]) => {
                const el = buttons.current[name]
                if (el) {
                    el.classList.toggle("active", !!gp.buttons[index]?.pressed)
                }
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
                <div className="dpad-wrap" ref={dpadWrap}>
                    <div className="dpad-lobe" ref={dpadLobe}>
                        <div ref={dpad} className="dpad-ring">
                            <div className="dir-l-r"></div>
                            <div className="dpad-hub"></div>
                            <div className="hub"></div>

                            <div className="arrow-r"></div>
                            <div className="arrow-l"></div>
                            <div className="arrow-u"></div>
                            <div className="arrow-d"></div>

                            <div className="dir-u-d"></div>

                            <span className="hit up"></span>
                            <span className="hit down"></span>
                            <span className="hit left"></span>
                            <span className="hit right"></span>
                        </div>
                    </div>
                </div>

                {/* Rote Frontplatten-Schrift */}
                <div className="select-start-labels" aria-hidden="true">
                    <span className="label-select">SELECT</span>
                    <span className="label-start">START</span>
                </div>

                {/* Select/Start */}
                <div className="center-buttons">
                    <div ref={el => buttons.current.Select = el} className="btn small select" aria-label="Select"/>
                    <div ref={el => buttons.current.Start = el} className="btn small start" aria-label="Start"/>
                </div>

                {/* A/B */}
                <div className="face-buttons">
                    <div className="button-box">
                        <div ref={el => buttons.current.Y = el} className="btn b" aria-label="B"/>
                    </div>
                    <div className="button-box">
                        <div ref={el => buttons.current.B = el} className="btn a" aria-label="A"/>
                    </div>
                </div>
            </div>
        </div>
    )
}
