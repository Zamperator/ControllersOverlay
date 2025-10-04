import React from "react"

export default function DebugBox({ devices, activeSetup }) {
    const pads = navigator.getGamepads()
    const lines = []

    if (!devices || (!devices.hotasX.length && !devices.t16000.length && !devices.twcs.length)) {
        return (
            <div className="debug active">
                <strong>No devices detected</strong>
            </div>
        )
    }

    lines.push(`Active Setup: ${activeSetup || "none"}`)
    lines.push("")

    function dumpDevice(title, indices) {
        if (!indices || indices.length === 0) return
        lines.push(`=== ${title} ===`)
        indices.forEach(index => {
            const gp = pads[index]
            if (!gp) return
            lines.push(`ID: ${gp.id}`)
            lines.push(`Index: ${index}`)
            lines.push("Axes:")
            gp.axes.forEach((val, i) => {
                lines.push(`  Axis ${i}: ${val.toFixed(3)}`)
            })
            lines.push("Buttons:")
            gp.buttons.forEach((btn, i) => {
                if (btn.pressed) {
                    lines.push(`  Button ${i}: pressed`)
                }
            })
            lines.push("") // Leerzeile
        })
    }

    dumpDevice("Hotas X", devices.hotasX)
    dumpDevice("T16000 Stick", devices.t16000)
    dumpDevice("TWCS Throttle", devices.twcs)
    dumpDevice("TFRP Pedals", devices.pedals)

    return (
        <pre className="debug active">
      {lines.join("\n")}
    </pre>
    )
}
