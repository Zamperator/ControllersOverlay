import { useEffect, useState } from "react"

export function useGamepads() {
    const [devices, setDevices] = useState({
        hotasX: [],
        t16000: [],
        twcs: [],
        pedals: []
    })
    const [activeSetup, setActiveSetup] = useState(null)

    useEffect(() => {
        let raf

        function loop() {
            const pads = navigator.getGamepads()
            const detected = { hotasX: [], t16000: [], twcs: [], pedals: [] }
            let mostRecent = null

            for (const gp of pads) {
                if (!gp) continue

                if (/Hotas\s*X/i.test(gp.id)) detected.hotasX.push(gp.index)
                else if (/T\.16000M/i.test(gp.id)) detected.t16000.push(gp.index)
                else if (/TWCS/i.test(gp.id)) detected.twcs.push(gp.index)
                else if (/TFRP/i.test(gp.id)) detected.pedals.push(gp.index)

                // Activity-Check (Deadzone + Buttons)
                const axisActive = gp.axes.some(a => Math.abs(a) > 0.25)
                const btnActive = gp.buttons.some(b => b.pressed)
                if (axisActive || btnActive) {
                    if (/Hotas\s*X/i.test(gp.id)) mostRecent = "hotasX"
                    else if (/T\.16000M/i.test(gp.id) && detected.twcs.length === 1) {
                        mostRecent = detected.t16000.length === 2 ? "dual16000" : "t16000"
                    }
                }
            }

            setDevices(detected)
            if (mostRecent) setActiveSetup(mostRecent)

            raf = requestAnimationFrame(loop)
        }

        loop()
        return () => cancelAnimationFrame(raf)
    }, [])

    return { devices, activeSetup }
}
