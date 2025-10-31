export function makeActiveGamepadPicker(opts = {}) {
    const deadzone   = opts.deadzone   ?? 0.25     // höher für GC-Adapter
    const axisWeight = opts.axisWeight ?? 0.5
    const minScore   = opts.minScore   ?? 1.0      // mehr als 1 Button oder deutliche Achsbewegung
    const holdMs     = opts.holdMs     ?? 5000     // wie lange wir am letzten Pad „kleben“
    const switchDebounceFrames = opts.switchDebounceFrames ?? 6 // so viele Frames in Folge muss newBest besser sein
    const scoreMargin = opts.scoreMargin ?? 0.5    // um wieviel besser newBest sein muss, um Wechsel zu rechtfertigen

    const prevRef = new Map() // index -> { axes:[], buttons:[], timestamp }
    let currentKey = ''
    let holdUntil = 0

    // Debounce-State für Wechsel
    let challengerKey = ''
    let challengerFrames = 0

    const keyOf = gp => gp ? `${gp.index}:${gp.id}` : ''
    const now = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()

    function activityScore(prev, curr) {
        if (!curr) return 0
        const buttons = Array.isArray(curr.buttons) ? curr.buttons : []
        const axes    = Array.isArray(curr.axes) ? curr.axes : []

        let score = 0

        // Buttons: gedrückt zählen stark, reine State-Changes leicht
        for (let i = 0; i < buttons.length; i++) {
            const isPressed  = !!buttons[i]?.pressed
            const wasPressed = !!prev?.buttons?.[i]?.pressed
            if (isPressed) score += 1
            else if (prev && isPressed !== wasPressed) score += 0.25
        }

        // Axes: Delta über Deadzone
        for (let i = 0; i < axes.length; i++) {
            const was = prev?.axes?.[i] ?? 0
            const is  = axes[i] ?? 0
            const delta = Math.abs(is - was)
            if (delta > deadzone) score += (delta - deadzone) * axisWeight
        }

        // WICHTIG: KEIN Timestamp-Bonus (GC-Adapter tickern im Idle)
        return score
    }

    function isPresent(pads, key) {
        if (!key) return false
        return pads.some(p => keyOf(p) === key)
    }

    // pick(padsLike, preferredKey?)
    return function pick(padsLike, preferredKey) {
        const pads = Array.from(padsLike || []).filter(p => p && typeof p.index === 'number')
        const t = now()

        // Snapshot + Scoring
        let best = null
        let bestScore = 0
        for (const gp of pads) {
            const prev = prevRef.get(gp.index)
            const score = activityScore(prev, gp)

            // Snapshot fürs nächste Frame
            prevRef.set(gp.index, {
                axes: Array.isArray(gp.axes) ? gp.axes.slice() : [],
                buttons: Array.isArray(gp.buttons) ? gp.buttons.map(b => ({ pressed: !!b?.pressed })) : [],
                timestamp: typeof gp.timestamp === 'number' ? gp.timestamp : 0
            })

            if (score > bestScore) {
                best = gp
                bestScore = score
            }
        }

        // 1) Wenn der Nutzer ein Pad gewählt hat → das gewinnt, solange verbunden
        if (preferredKey) {
            const pref = pads.find(p => keyOf(p) === preferredKey)
            if (pref) {
                currentKey = preferredKey
                holdUntil = t + holdMs
                challengerKey = ''
                challengerFrames = 0
                return pref
            }
        }

        // 2) Wenn wir bereits ein Pad haben und es ist noch da → sticky halten
        if (currentKey && isPresent(pads, currentKey)) {
            const curr = pads.find(p => keyOf(p) === currentKey)
            // Gibt es einen ernsthaften Herausforderer?
            if (best && keyOf(best) !== currentKey && bestScore >= minScore) {
                // wie viel Aktivität hat das aktuelle Pad?
                const currPrev = prevRef.get(curr.index)
                const currScore = activityScore(currPrev, curr)

                if (bestScore >= currScore + scoreMargin) {
                    // gleicher Challenger wie im letzten Frame?
                    if (challengerKey === keyOf(best)) {
                        challengerFrames++
                    } else {
                        challengerKey = keyOf(best)
                        challengerFrames = 1
                    }

                    // nur wechseln, wenn er stabil besser ist
                    if (challengerFrames >= switchDebounceFrames) {
                        currentKey = challengerKey
                        holdUntil = t + holdMs
                        challengerKey = ''
                        challengerFrames = 0
                        return pads.find(p => keyOf(p) === currentKey) || null
                    }
                } else {
                    // nicht klar besser → Challenger verwerfen
                    challengerKey = ''
                    challengerFrames = 0
                }
            } else {
                // kein Challenger → Ruhe bewahren
                challengerKey = ''
                challengerFrames = 0
            }

            // aktuelle Auswahl behalten (ohne Timeout auf null zu fallen)
            return curr
        }

        // 3) Noch kein currentKey? Bei echter Aktivität eins claimen.
        if (best && bestScore >= minScore) {
            currentKey = keyOf(best)
            holdUntil = t + holdMs
            challengerKey = ''
            challengerFrames = 0
            return best
        }

        // 4) Als Fail-safe: Wenn wir kürzlich eins hatten und es noch da ist → behalten
        if (currentKey && t < holdUntil && isPresent(pads, currentKey)) {
            return pads.find(p => keyOf(p) === currentKey) || null
        }

        // 5) Nichts aktiv
        return null
    }
}
