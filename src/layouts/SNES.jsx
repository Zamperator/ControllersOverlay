import React, { useEffect, useMemo, useRef } from "react";
import {makeActiveGamepadPicker} from "@/lib/activeGamepad";
import "@/styles/devices/SNES.css";

export default function SNES() {
    const buttons = useRef({});
    const dpad = useRef(null);

    // Controller Mapping
    const buttonMap = useMemo(() => ({
        0: "B",
        1: "A",
        2: "Y",
        3: "X",
        4: "L",
        5: "R",
        8: "Select",
        9: "Start",
    }), []);

    const activeController = useMemo(() => makeActiveGamepadPicker({ timeoutMs: 2000, deadzone: .15 }), [])

    useEffect(() => {
        let raf;
        const update = () => {
            const pads = navigator.getGamepads?.() || [];
            const gp = activeController(pads, null)
            if (!gp) {
                raf = requestAnimationFrame(update);
                return;
            }

            // D-Pad (Axes)
            if (dpad.current) {
                const x = gp.axes[0] ?? 0;
                const y = gp.axes[1] ?? 0;
                dpad.current.classList.toggle("active-left",  x < -0.5);
                dpad.current.classList.toggle("active-right", x >  0.5);
                dpad.current.classList.toggle("active-up",    y < -0.5);
                dpad.current.classList.toggle("active-down",  y >  0.5);
            }

            // Buttons
            const hit = {
                A: ".btn-a", B: ".btn-b", X: ".btn-x", Y: ".btn-y",
                L: ".btn-l", R: ".btn-r",
                Select: ".select", Start: ".start",
            };
            Object.entries(buttonMap).forEach(([idx, name]) => {
                const sel = hit[name];
                const el = sel ? document.querySelector(sel) : null;
                if (el) el.classList.toggle("active", !!gp.buttons[idx]?.pressed);
            });

            raf = requestAnimationFrame(update);
        };
        update();
        return () => cancelAnimationFrame(raf);
    }, [activeController, buttonMap]);

    return (
        <div className="overlay snes theme-pal">
            {/* exakt die Vorlage */}
            <div className="controller-body">
                <div ref={el => (buttons.current.L = el)} className="btn-l">L</div>

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

                <div className="center-plate">
                    <div className="cable-in"></div>
                    <div className="snes">Super Nintendo</div>
                    <div className="snes-name">Entertainment System</div>
                    <div ref={el => (buttons.current.Select = el)} className="select"></div>
                    <div ref={el => (buttons.current.Start = el)} className="start"></div>
                    <div className="select-label">select</div>
                    <div className="start-label">start</div>
                </div>

                <div ref={el => (buttons.current.R = el)} className="btn-r">R</div>

                <div className="button-lobe">
                    <div className="face-btns">
                        <div className="bg-xy">
                            <div ref={el => (buttons.current.X = el)} className="btn-x">
                                <div className="label-btn">X</div>
                            </div>
                            <div ref={el => (buttons.current.Y = el)} className="btn-y">
                                <div className="label-btn">Y</div>
                            </div>
                        </div>
                        <div className="bg-ab">
                            <div ref={el => (buttons.current.A = el)} className="btn-a">
                                <div className="label-btn">A</div>
                            </div>
                            <div ref={el => (buttons.current.B = el)} className="btn-b">
                                <div className="label-btn">B</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
