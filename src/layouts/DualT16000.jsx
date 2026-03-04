import React, {useEffect, useMemo, useRef} from "react"
import "@/styles/devices/DualT16000.css"

/**
 * URL module parameter: &modules=left,right,twcs
 *
 * Supported tokens (comma-separated):
 *   left   – T.16000M FCS joystick #1 (first T16000 device found)
 *   right  – T.16000M FCS joystick #2 (second T16000 device; mirrored layout)
 *   twcs   – TWCS Throttle panel
 *
 * Panel order follows the token order in the URL.
 * Default when omitted: left,twcs
 */

// ─── Device matching ─────────────────────────────────────────────────────────
//
// Chrome reports the Thrustmaster T.16000M FCS as e.g.:
//   "T.16000M FCS Joystick (Vendor: 044f Product: b10a)"
//
// The dot between T and 16000 makes a naive /T16000/i fail.
// Using /T\.?16000/i covers both "T.16000" and "T16000".
//
const RE_T16000 = /T\.?16000/i
const RE_TWCS = /TWCS/i

// ──── Button layout ───────────────────────────────────────────────────────────
const STICK_LAYOUT = {
    left: {
        leftCol: [4, 5, 6, 9, 8, 7],
        rightCol: [12, 11, 10, 13, 14, 15],
    },
    right: {
        leftCol: [10, 11, 12, 15, 14, 13],
        rightCol: [6, 5, 4, 7, 8, 9],
    },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert HAT POV axis value (-1…+1) to {x, y} unit vector, or null if centered. */
function hatPovToXY(pov) {
    const steps = [
        {v: -1.000, a: 0},
        {v: -0.714, a: 45},
        {v: -0.428, a: 90},
        {v: -0.143, a: 135},
        {v: 0.143, a: 180},
        {v: 0.428, a: 225},
        {v: 0.714, a: 270},
        {v: 1.000, a: 315},
    ]
    let best = null, bestDiff = Infinity
    for (const s of steps) {
        const d = Math.abs(pov - s.v)
        if (d < bestDiff) {
            bestDiff = d;
            best = s
        }
    }
    if (!best || bestDiff > 0.08) {
        return null
    }
    const rad = (best.a * Math.PI) / 180
    return {x: Math.sin(rad), y: -Math.cos(rad)}
}

/**
 * Update a single T16000 stick panel's DOM elements.
 * @param {{current}} stickInd    ref – stick position dot
 * @param {{current}} rudderInd   ref – rudder bar handle
 * @param {{current}} hatBase     ref – HAT outer ring
 * @param {{current}} hatKnob     ref – HAT inner knob
 * @param {{current}} sliderHandle ref – base throttle slider handle (axis 6)
 * @param {Gamepad|null} gp       live Gamepad object (null = skip)
 * @param {string} prefix         button ID prefix, "lt" or "rt"
 */
function updateStick(stickInd, rudderInd, hatBase, hatKnob, sliderHandle, gp, prefix) {
    if (!gp) {
        return
    }

    // Stick X / Y  (axes 0, 1)
    if (stickInd.current?.parentElement) {
        const {clientWidth: w, clientHeight: h} = stickInd.current.parentElement
        stickInd.current.style.transform =
            `translate(calc(-50% + ${gp.axes[0] * w / 2}px), calc(-50% + ${gp.axes[1] * h / 2}px))`
    }

    // Rudder  (axis 5)
    if (rudderInd.current?.parentElement) {
        const bar = rudderInd.current.parentElement
        const range = bar.clientWidth - rudderInd.current.clientWidth
        rudderInd.current.style.left = `${((gp.axes[5] + 1) / 2) * range}px`
    }

    // Base throttle slider  (axis 6)
    if (sliderHandle.current?.parentElement) {
        const bar = sliderHandle.current.parentElement
        const range = bar.clientHeight - sliderHandle.current.clientHeight
        sliderHandle.current.style.top = `${((gp.axes[6] + 1) / 2) * range}px`
    }

    // HAT  (axis 9) – knob moves in pressed direction
    if (hatBase.current && hatKnob.current) {
        const dir = hatPovToXY(gp.axes[9])
        hatBase.current.classList.toggle("active", !!dir)
        if (dir) {
            const box = hatBase.current.getBoundingClientRect()
            const ind = hatKnob.current.getBoundingClientRect()
            hatKnob.current.style.transform =
                `translate(calc(-50% + ${dir.x * (box.width - ind.width) / 2}px),` +
                ` calc(-50% + ${dir.y * (box.height - ind.height) / 2}px))`
        }
        else {
            hatKnob.current.style.transform = "translate(-50%, -50%)"
        }
    }

    // Buttons
    gp.buttons.forEach((btn, i) => {
        document.getElementById(`${prefix}-btn-${i}`)?.classList.toggle("active", btn.pressed)
    })
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DualT16000() {

    // Parse ordered module list from URL (order determines panel layout)
    const modulesOrder = useMemo(() => {
        const raw = new URLSearchParams(window.location.search).get("modules") ?? "left,twcs"
        return raw.toLowerCase().split(",").map(s => s.trim()).filter(Boolean)
    }, [])

    const hasLeft = modulesOrder.includes("left")
    const hasRight = modulesOrder.includes("right")
    const hasTwcs = modulesOrder.includes("twcs")

    // ?swap=1 → swap left/right device assignment (first found T16000 becomes left)
    const swapSticks = new URLSearchParams(window.location.search).get("swap") === "1"

    // T.16000M (left) refs
    const lStickInd = useRef(null)
    const lRudderInd = useRef(null)
    const lHatBase = useRef(null)
    const lHatKnob = useRef(null)
    const lSlider = useRef(null)   // base throttle slider (axis 6)
    const lSignal = useRef(null)   // connection indicator dot

    // T.16000M (right) refs
    const rStickInd = useRef(null)
    const rRudderInd = useRef(null)
    const rHatBase = useRef(null)
    const rHatKnob = useRef(null)
    const rSlider = useRef(null)
    const rSignal = useRef(null)

    // TWCS refs
    const throttleFill = useRef(null)
    const miniStickInd = useRef(null)
    const dialHandle = useRef(null)
    const flipHandle = useRef(null)
    const wHatBase = useRef(null)
    const wHatKnob = useRef(null)
    const wSignal = useRef(null)

    // One-time debug log so devs can verify the actual device IDs
    const loggedOnce = useRef(false)

    useEffect(() => {
        let raf

        function update() {
            const pads = [...(navigator.getGamepads?.() || [])].filter(Boolean)

            // Log detected device IDs once on first gamepad appearance
            if (!loggedOnce.current && pads.length > 0) {
                loggedOnce.current = true
                console.log("[DualT16000] Detected gamepads:", pads.map(g => `[${g.index}] ${g.id}`))
            }

            // ── Find relevant devices ─────────────────────────────────────
            // RE_T16000 = /T\.?16000/i  → matches "T.16000M FCS" and "T16000M FCS"
            const t16000List = pads.filter(g => RE_T16000.test(g.id))
            const twcsDevice = hasTwcs ? (pads.find(g => RE_TWCS.test(g.id)) ?? null) : null

            // Wait until at least one target device appears
            if (t16000List.length === 0 && !twcsDevice) {
                raf = requestAnimationFrame(update)
                return
            }

            // ── Assign sticks ─────────────────────────────────────────────
            // Default (swap=0): first found T16000 = right, second = left.
            // With ?swap=1:     first found T16000 = left,  second = right.
            // Single side: first found device = that side (swap has no effect).
            let leftStick = null
            let rightStick = null

            // Consistent assignment: swap=0 → [0]=right / [1]=left
            //                        swap=1 → [0]=left  / [1]=right
            // Fallback to [0] when only one device is connected.
            const [dev0, dev1] = [t16000List[0] ?? null, t16000List[1] ?? null]
            const assignedLeft  = swapSticks ? dev0 : (dev1 ?? dev0)
            const assignedRight = swapSticks ? (dev1 ?? dev0) : dev0

            if (hasLeft && hasRight) {
                leftStick  = assignedLeft
                rightStick = assignedRight
            }
            else if (hasLeft) {
                leftStick = assignedLeft
            }
            else if (hasRight) {
                rightStick = assignedRight
            }

            // ── Connection indicators ─────────────────────────────────────
            lSignal.current?.classList.toggle("connected", !!leftStick)
            rSignal.current?.classList.toggle("connected", !!rightStick)
            wSignal.current?.classList.toggle("connected", !!twcsDevice)

            // ── Update stick panels ───────────────────────────────────────
            updateStick(lStickInd, lRudderInd, lHatBase, lHatKnob, lSlider, leftStick, "lt")
            updateStick(rStickInd, rRudderInd, rHatBase, rHatKnob, rSlider, rightStick, "rt")

            // ── Update TWCS panel ─────────────────────────────────────────
            if (twcsDevice) {
                // Throttle (axis 2, inverted: forward push = 100 %)
                if (throttleFill.current) {
                    const pct = ((-(twcsDevice.axes[2] ?? 0) + 1) / 2) * 100
                    throttleFill.current.style.height = `${pct}%`
                    throttleFill.current.style.backgroundColor = `hsl(${pct * 1.2}, 90%, 42%)`
                }

                // Mini-stick (axes 0, 1)
                if (miniStickInd.current?.parentElement) {
                    const {clientWidth: w, clientHeight: h} = miniStickInd.current.parentElement
                    miniStickInd.current.style.transform =
                        `translate(calc(-50% + ${twcsDevice.axes[0] * w / 2}px),` +
                        ` calc(-50% + ${twcsDevice.axes[1] * h / 2}px))`
                }

                // Dial (axis 7)
                if (dialHandle.current?.parentElement) {
                    const bar = dialHandle.current.parentElement
                    const range = bar.clientWidth - dialHandle.current.clientWidth
                    dialHandle.current.style.left = `${((twcsDevice.axes[7] + 1) / 2) * range}px`
                }

                // Flip switch (axis 5)
                if (flipHandle.current?.parentElement) {
                    const bar = flipHandle.current.parentElement
                    const range = bar.clientWidth - flipHandle.current.clientWidth
                    flipHandle.current.style.left = `${((twcsDevice.axes[5] + 1) / 2) * range}px`
                }

                // HAT (axis 9) – knob moves in pressed direction
                if (wHatBase.current && wHatKnob.current) {
                    const dir = hatPovToXY(twcsDevice.axes[9])
                    wHatBase.current.classList.toggle("active", !!dir)
                    if (dir) {
                        const box = wHatBase.current.getBoundingClientRect()
                        const ind = wHatKnob.current.getBoundingClientRect()
                        wHatKnob.current.style.transform =
                            `translate(calc(-50% + ${dir.x * (box.width - ind.width) / 2}px),` +
                            ` calc(-50% + ${dir.y * (box.height - ind.height) / 2}px))`
                    }
                    else {
                        wHatKnob.current.style.transform = "translate(-50%, -50%)"
                    }
                }

                // Buttons
                twcsDevice.buttons.forEach((btn, i) => {
                    document.getElementById(`w-btn-${i}`)?.classList.toggle("active", btn.pressed)
                })
            }

            raf = requestAnimationFrame(update)
        }

        update()
        return () => raf && cancelAnimationFrame(raf)
    }, [hasLeft, hasRight, hasTwcs, swapSticks])

    // ── JSX factories ─────────────────────────────────────────────────────────

    const stickPanel = (label, hand, stickInd, rudderInd, hatBase, hatKnob, sliderRef, prefix, signalRef) => {
        const layout = STICK_LAYOUT[hand] ?? STICK_LAYOUT.right

        return (
            <div className="panel stick-panel">
                <div className="panel-label">
                    {label}
                    <span className="signal-dot" ref={signalRef}/>
                </div>

                <div className="stick-area">
                    <div className="btn-col">
                        {layout.leftCol.map(n => (
                            <div key={n} id={`${prefix}-btn-${n}`} className="btn">{n}</div>
                        ))}
                    </div>

                    <div className="stick-center">
                        <div className="stick">
                            <div ref={stickInd} className="stick-ind"/>
                        </div>

                        <div className="rudder">
                            <div ref={rudderInd} className="rudder-ind"/>
                        </div>

                        <div className="hat-row">
                            <div id={`${prefix}-btn-2`} className="btn">2</div>
                            <div ref={hatBase} className="hat-base">
                                <div ref={hatKnob} className="hat-knob"/>
                            </div>
                            <div id={`${prefix}-btn-3`} className="btn">3</div>
                        </div>

                        <div className="grip-btns">
                            <div id={`${prefix}-btn-0`} className="btn trg">TRG</div>
                            <div id={`${prefix}-btn-1`} className="btn">1</div>
                        </div>
                    </div>

                    <div className="btn-col-wrap">
                        <div className="btn-col">
                            {layout.rightCol.map(n => (
                                <div key={n} id={`${prefix}-btn-${n}`} className="btn">{n}</div>
                            ))}
                        </div>

                        <div className="stick-slider">
                            <div ref={sliderRef} className="stick-slider-handle"/>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const twcsPanel = () => (
        <div className="panel twcs-panel">
            <div className="panel-label">
                TWCS
                <span className="signal-dot" ref={wSignal}/>
            </div>
            <div className="twcs-body">
                <div className="throttle">
                    <div ref={throttleFill} className="thr-fill"/>
                </div>
                <div className="twcs-controls">
                    <div className="coolies">
                        <div className="coolie">
                            {[6, 7, 8, 9].map(i =>
                                <div key={i} id={`w-btn-${i}`} className="btn">{i}</div>
                            )}
                        </div>
                        <div className="coolie">
                            {[10, 11, 12, 13].map(i =>
                                <div key={i} id={`w-btn-${i}`} className="btn">{i}</div>
                            )}
                        </div>
                        <div ref={wHatBase} className="hat-base">
                            <div ref={wHatKnob} className="hat-knob"/>
                        </div>
                    </div>
                    <div className="orange-toggle-row">
                        <div className="orange-row">
                            {[0, 1, 2].map(i =>
                                <div key={i} id={`w-btn-${i}`} className="btn orange">{i}</div>
                            )}
                        </div>
                        <div className="toggles">
                            <div id="w-btn-3" className="btn">↑</div>
                            <div id="w-btn-4" className="btn">↓</div>
                        </div>
                    </div>
                    <div className="mini-row">
                        <div className="mini-stick">
                            <div ref={miniStickInd} className="mini-ind"/>
                        </div>
                        <div className="sliders">
                            <div className="flip">
                                <div ref={flipHandle} className="flip-hand"/>
                            </div>
                            <div className="dial">
                                <div ref={dialHandle} className="dial-hand"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    // ── Render – panels in URL order ──────────────────────────────────────────

    return (
        <div className={`overlay t16000-twcs panels-${[hasLeft, hasRight, hasTwcs].filter(Boolean).length}`}>
            {modulesOrder.map((mod, idx) => (
                <React.Fragment key={mod}>
                    {/*idx > 0 && <div className="panel-sep"/>*/}
                    {mod === "left" && stickPanel(`T.16000M (${idx})`, "left", lStickInd, lRudderInd, lHatBase, lHatKnob, lSlider, "lt", lSignal)}
                    {mod === "right" && stickPanel(`T.16000M (${idx})`, "right", rStickInd, rRudderInd, rHatBase, rHatKnob, rSlider, "rt", rSignal)}
                    {mod === "twcs" && twcsPanel()}
                </React.Fragment>
            ))}
        </div>
    )
}