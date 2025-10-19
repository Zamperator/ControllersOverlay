import { useEffect, useState } from "react"
import { controllerDevices, controllerSetups } from "../config/config"

/**
 * useGamepads – erkennt verbundene Gamepads & deren Aktivität.
 *
 * @param {number} updateInterval - Polling-Intervall in Millisekunden (Standard: 100 ms ≈ 10 FPS)
 * @returns {object} { devices, activeSetup }
 */
export function useGamepads(updateInterval = 100) {
    const [devices, setDevices] = useState(() => {
        const init = {}
        for (const key of Object.keys(controllerDevices)) {
            init[key] = []
        }
        return init
    })

    const [activeSetup, setActiveSetup] = useState(null)

    useEffect(() => {
        let raf
        let lastUpdate = 0

        function loop(now) {
            // Nur alle `updateInterval` Millisekunden aktualisieren
            if (now - lastUpdate >= updateInterval) {
                const pads = navigator.getGamepads()
                const detected = {}

                console.log(pads)

                // neue, saubere Struktur erzeugen
                for (const key of Object.keys(controllerDevices)) {
                    detected[key] = []
                }

                let mostRecent = null

                for (const gp of pads) {
                    if (!gp) {
                        continue
                    }

                    // dynamisch nach Regex aus controllerSetups matchen
                    for (const [key, setup] of Object.entries(controllerSetups)) {
                        if (setup.regex.test(gp.id)) {
                            detected[key].push(gp.index)
                        }
                    }

                    // Aktivitäts-Erkennung
                    const axisActive = gp.axes.some(a => Math.abs(a) > 0.25)
                    const btnActive = gp.buttons.some(b => b.pressed)

                    if (axisActive || btnActive) {
                        for (const [key, setup] of Object.entries(controllerSetups)) {
                            if (setup.regex.test(gp.id)) {
                                mostRecent = key
                            }
                        }
                    }
                }

                // Nur updaten, wenn sich etwas geändert hat
                setDevices(prev => {
                    const changed = JSON.stringify(prev) !== JSON.stringify(detected)
                    if (changed) {
                        return detected
                    } else {
                        return prev
                    }
                })

                if (mostRecent && mostRecent !== activeSetup) {
                    setActiveSetup(mostRecent)
                }

                lastUpdate = now
            }

            raf = requestAnimationFrame(loop)
        }

        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [activeSetup, updateInterval])

    return { devices, activeSetup }
}
