import React, {useEffect, useMemo, useRef} from "react"
import {makeActiveGamepadPicker} from "@/lib/activeGamepad";
import "@/styles/devices/T16000.css"

export default function T16000() {
    const stickInd = useRef(null)
    const rudderInd = useRef(null)
    const throttleHandle = useRef(null)
    const miniStickInd = useRef(null)
    const dialHandle = useRef(null)
    const flipHandle = useRef(null)
    const hatArrow = useRef(null)

    const sideParam = new URLSearchParams(window.location.search).get("side")
    const twcsSide = sideParam === "right" ? "right" : "left"

    const activeController = useMemo(() => makeActiveGamepadPicker({timeoutMs: 2000, deadzone: .15}), [])

    useEffect(() => {

        let raf

        function update() {

            const pads = navigator.getGamepads?.() || []
            const gp = activeController(pads, null)
            if (!gp) {
                raf = requestAnimationFrame(update);
                return;
            }

            const stick = [...pads].find(gp => gp && /T16000/i.test(gp.id))
            const twcs = [...pads].find(gp => gp && /TWCS/i.test(gp.id))

            // === Stick ===
            if (stick) {
                const sx = stick.axes[0], sy = stick.axes[1]
                const stickRangeX = stickInd.current.parentElement.clientWidth / 2
                const stickRangeY = stickInd.current.parentElement.clientHeight / 2
                stickInd.current.style.transform =
                    `translate(calc(-50% + ${sx * stickRangeX}px), calc(-50% + ${sy * stickRangeY}px))`

                const rz = stick.axes[5]
                const rudderRange = rudderInd.current.parentElement.clientWidth - rudderInd.current.clientWidth
                rudderInd.current.style.left = `${((rz + 1) / 2) * rudderRange}px`

                // Hat (Axis 9)
                const pov = stick.axes[9]
                hatArrow.current.classList.remove("active")
                let angle = null
                if (Math.abs(pov - (-1)) < 0.05) {
                    angle = 0
                }
                else if (Math.abs(pov - (-0.714)) < 0.05) {
                    angle = 45
                }
                else if (Math.abs(pov - (-0.428)) < 0.05) {
                    angle = 90
                }
                else if (Math.abs(pov - (-0.143)) < 0.05) {
                    angle = 135
                }
                else if (Math.abs(pov - (0.143)) < 0.05) {
                    angle = 180
                }
                else if (Math.abs(pov - (0.428)) < 0.05) {
                    angle = 225
                }
                else if (Math.abs(pov - (0.714)) < 0.05) {
                    angle = 270
                }
                else if (Math.abs(pov - (1)) < 0.05) {
                    angle = 315
                }
                if (angle !== null) {
                    hatArrow.current.classList.add("active")
                    hatArrow.current.style.transform =
                        `translate(-50%, -50%) rotate(${angle}deg)`
                }

                stick.buttons.forEach((btn, i) => {
                    const el = document.getElementById(`stick-btn-${i}`)
                    if (el) {
                        el.classList.toggle("active", btn.pressed)
                    }
                })
            }

            // === TWCS ===
            if (twcs) {
                const z = twcs.axes[2] // Throttle
                const throttleRange = throttleHandle.current.parentElement.clientHeight - throttleHandle.current.clientHeight
                throttleHandle.current.style.top = `${((z + 1) / 2) * throttleRange}px`

                const mx = twcs.axes[0], my = twcs.axes[1] // Mini-Stick
                const miniRangeX = miniStickInd.current.parentElement.clientWidth / 2
                const miniRangeY = miniStickInd.current.parentElement.clientHeight / 2
                miniStickInd.current.style.transform =
                    `translate(calc(-50% + ${mx * miniRangeX}px), calc(-50% + ${my * miniRangeY}px))`

                const d = twcs.axes[7] // Dial
                const dialRange = dialHandle.current.parentElement.clientWidth - dialHandle.current.clientWidth
                dialHandle.current.style.left = `${((d + 1) / 2) * dialRange}px`

                const f = twcs.axes[5] // Flip-Schalter
                const flipRange = flipHandle.current.parentElement.clientWidth - flipHandle.current.clientWidth
                flipHandle.current.style.left = `${((f + 1) / 2) * flipRange}px`

                twcs.buttons.forEach((btn, i) => {
                    const el = document.getElementById(`twcs-btn-${i}`)
                    if (el) {
                        el.classList.toggle("active", btn.pressed)
                    }
                })
            }

            raf = requestAnimationFrame(update)
        }

        update()
        return () => cancelAnimationFrame(raf)
    }, [activeController])

    return (
        <div className={`overlay t16000 ${twcsSide}`}>
            {/* === Stick === */}
            <div className="stick-block">
                <div className="stick">
                    <div ref={stickInd} className="stick-indicator"></div>
                </div>
                <div className="rudder">
                    <div ref={rudderInd} className="rudder-indicator"></div>
                </div>

                <div className="hat-group">
                    <div id="stick-btn-2" className="button">2</div>
                    <div className="hat">
                        <div ref={hatArrow} className="hat-arrow"></div>
                    </div>
                    <div id="stick-btn-3" className="button">3</div>
                </div>
                <div id="stick-btn-1" className="button under-hat">1</div>
                <div id="stick-btn-0" className="button trigger">TRG</div>

                <div className="button-grid left">{[4, 5, 6, 9, 8, 7].map(n =>
                    <div key={n} id={`stick-btn-${n}`} className="button">{n}</div>)}
                </div>
                <div className="button-grid right">{[10, 11, 12, 13, 14, 15].map(n =>
                    <div key={n} id={`stick-btn-${n}`} className="button">{n}</div>)}
                </div>
            </div>

            {/* === TWCS === */}
            <div className="twcs-block">
                <div className="throttle">
                    <div ref={throttleHandle} className="throttle-handle"></div>
                </div>
                <div className="mini-stick">
                    <div ref={miniStickInd} className="mini-stick-indicator"></div>
                </div>

                <div className="cooliehats">
                    <div className="cooliehat">{[6, 7, 8, 9].map(i =>
                        <div key={i} id={`twcs-btn-${i}`} className="button">{i}</div>)}
                    </div>
                    <div className="cooliehat">{[10, 11, 12, 13].map(i =>
                        <div key={i} id={`twcs-btn-${i}`} className="button">{i}</div>)}
                    </div>
                </div>

                <div className="orange-buttons">{[0, 1, 2].map(i =>
                    <div key={i} id={`twcs-btn-${i}`} className="button orange">{i}</div>)}
                </div>

                <div className="toggle-switch">
                    <div id="twcs-btn-3" className="button">↑</div>
                    <div id="twcs-btn-4" className="button">↓</div>
                </div>

                <div className="flip-switch">
                    <div ref={flipHandle} className="flip-handle"></div>
                </div>

                <div className="dial">
                    <div ref={dialHandle} className="dial-handle"></div>
                </div>
            </div>
        </div>
    )
}
