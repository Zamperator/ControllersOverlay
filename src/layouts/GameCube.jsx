import React, { useEffect, useMemo, useRef } from "react"
import "../styles/devices/GameCube.css"
import {makeActiveGamepadPicker} from "@/lib/activeGamepad";

export default function GameCube() {
    const dpad = useRef(null)
    const stickBase = useRef(null)
    const stickHat = useRef(null)
    const cstickBase = useRef(null)
    const cstickHat = useRef(null)
    const buttons = useRef({})

    // Button-Index-Mapping deines Pads
    const buttonMap = useMemo(() => ({
        0: "A",
        1: "B",
        2: "X",
        3: "Y",
        4: "ZL",
        5: "ZR",
        6: "L",
        7: "R",
        8: "-",
        9: "+",
        10: "LS",
        11: "RS",
        12: "D-Pad hoch",
        13: "D-Pad runter",
        14: "D-Pad links",
        15: "D-Pad rechts",
        16: "Home"
        // Achse 0/1 = linker Stick (X/Y)
        // Achse 2/3 = C-Stick (X/Y)
    }), [])

    // === Config ===
    const AXIS_BIAS = { 0: 0.0, 1: 0.249, 2: 0.0, 3: 0.0 };   // dein Offset: Achse 1 = +0.249
    const SMOOTH = 0.35;                                      // 0 = sofort, 1 = sehr träge

    // helper: clamp
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const activeController = useMemo(() =>
        makeActiveGamepadPicker({
            deadzone: .25,
            minScore: 1.0,
            holdMs: 5000,
            switchDebounceFrames: 6,
            scoreMargin: 0.5
        }), []
    )

    useEffect(() => {
        let raf

        // per-Stick State für Glättung
        const _stickState = new WeakMap(); // baseEl -> {x,y}

        // helper: Bias + Deadzone (radial) + Re-Scaling
        function normalizeAxes(gp, xAxis, yAxis, dz) {
            // Bias abziehen
            let x = (gp.axes[xAxis] ?? 0) - (AXIS_BIAS[xAxis] ?? 0);
            let y = (gp.axes[yAxis] ?? 0) - (AXIS_BIAS[yAxis] ?? 0);

            // hart auf -1..1 einfangen (falls Pads überziehen)
            x = clamp(x, -1, 1);
            y = clamp(y, -1, 1);

            // radialer Deadzone mit Re-Scaling (sauberer als pro-Achse)
            const r = Math.hypot(x, y);
            if (r < dz) return { x: 0, y: 0 };
            const scale = (r - dz) / (1 - dz);
            const nx = (x / (r || 1)) * scale;
            const ny = (y / (r || 1)) * scale;

            // sehr kleine Reste killen
            return {
                x: Math.abs(nx) < 1e-3 ? 0 : nx,
                y: Math.abs(ny) < 1e-3 ? 0 : ny
            };
        }

        function moveStick(base, hat, gp, xAxis, yAxis, { deadzone = 0.12 } = {}) {
            if (!base || !hat) return;

            const box = base.getBoundingClientRect();
            const ind = hat.getBoundingClientRect();
            const rangeX = (box.width - ind.width) / 2;
            const rangeY = (box.height - ind.height) / 2;

            // === Offset + Deadzone anwenden
            const { x, y } = normalizeAxes(gp, xAxis, yAxis, deadzone);

            // === Glättung (optional)
            const prev = _stickState.get(base) || { x: 0, y: 0 };
            const nx = prev.x + (x - prev.x) * (1 - SMOOTH);
            const ny = prev.y + (y - prev.y) * (1 - SMOOTH);
            _stickState.set(base, { x: nx, y: ny });

            hat.style.transform =
                `translate(calc(-50% + ${nx * rangeX}px), calc(-50% + ${ny * rangeY}px))`;
        }

        const update = () => {

            const pads = navigator.getGamepads?.() || [];
            const gp = activeController(pads)
            if (!gp) {
                raf = requestAnimationFrame(update);
                return;
            }

            // === Sticks ===
            moveStick(stickBase.current, stickHat.current, gp, 0, 1)
            moveStick(cstickBase.current, cstickHat.current, gp, 2, 3)

            // === Buttons ===
            Object.entries(buttonMap).forEach(([i, name]) => {
                const el = buttons.current && buttons.current[name]
                if (!el) {
                    return
                }
                const pressed = !!gp.buttons[i]?.pressed
                el.classList.toggle("active", pressed)
            })

            // === D-Pad als Klassen am Container (wie bei Xbox) ===
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

    }, [buttonMap])

    return (
        <div className="overlay gamecube">
            <div className="controller-body">
                <div className="bumpers">
                    <div className="bumper bumper-l" ref={el => buttons.current.L = el}></div>
                    <div className="bumper bumper-r" ref={el => buttons.current.R = el}></div>

                    {/* neue Z-Pads zusätzlich zu L/R */}
                    <div className="zpad zl" ref={el => buttons.current.ZL = el}>ZL</div>
                    <div className="zpad zr" ref={el => buttons.current.ZR = el}>ZR</div>

                    {/* (dein bisheriges) Z rechts oben kannst du entfernen ODER behalten,
      falls du beides brauchst – ich lasse es weg, um Doppelung zu vermeiden */}
                </div>

                <div className="start-btn" ref={el => buttons.current.Start = el}></div>

                {/* linker Stick */}
                <div className="stick left" ref={stickBase}>
                    <div className="gate"></div>
                    <div className="press ls" ref={el => buttons.current.LS = el}></div>
                    <div className="hat" ref={stickHat}></div>
                </div>

                <div className="dpad" ref={dpad}>
                    <div className="cross vert"></div>
                    <div className="cross horiz"></div>
                    <div className="nub"></div>

                    {/* neue, rein visuelle Layer für saubere Richtungs-Highlights */}
                    <span className="arm up"></span>
                    <span className="arm down"></span>
                    <span className="arm left"></span>
                    <span className="arm right"></span>
                </div>

                <div className="face">
                    <div className="btn a" ref={el => buttons.current.A = el}>A</div>
                    <div className="btn b" ref={el => buttons.current.B = el}>B</div>
                    <div className="btn x" ref={el => buttons.current.X = el}>X</div>
                    <div className="btn y" ref={el => buttons.current.Y = el}>Y</div>
                </div>

                {/* C-Stick */}
                <div className="stick cstick" ref={cstickBase}>
                    <div className="gate"></div>
                    <div className="press rs" ref={el => buttons.current.RS = el}></div>
                    <div className="hat" ref={cstickHat}></div>
                </div>
            </div>
        </div>
    )
}
