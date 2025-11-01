export function makeActiveGamepadPicker(opts = {}) {
    const deadzone   = opts.deadzone   ?? 0.25     // higher for GC adapters
    const axisWeight = opts.axisWeight ?? 0.5
    const minScore   = opts.minScore   ?? 1.0      // more than "1 button press" worth of activity
    const holdMs     = opts.holdMs     ?? 5000     // how long to hold onto a disconnected pad
    const switchDebounceFrames = opts.switchDebounceFrames ?? 6 // this many frames of stable better score to switch
    const scoreMargin = opts.scoreMargin ?? 0.5    // how much better must the new pad be to count as a challenger

    const prevRef = new Map() // index -> { axes:[], buttons:[], timestamp }
    let currentKey = ''
    let holdUntil = 0

    // Debounce state for challenger
    let challengerKey = ''
    let challengerFrames = 0

    const keyOf = gp => gp ? `${gp.index}:${gp.id}` : ''
    const now = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()

    function activityScore(prev, curr) {
        if (!curr) return 0
        const buttons = Array.isArray(curr.buttons) ? curr.buttons : []
        const axes    = Array.isArray(curr.axes) ? curr.axes : []

        let score = 0

        // Buttons: pushed counts stronger, pure state-changes light
        for (let i = 0; i < buttons.length; i++) {
            const isPressed  = !!buttons[i]?.pressed
            const wasPressed = !!prev?.buttons?.[i]?.pressed
            if (isPressed) score += 1
            else if (prev && isPressed !== wasPressed) score += 0.25
        }

        // Axes: Delta over Deadzone
        for (let i = 0; i < axes.length; i++) {
            const was = prev?.axes?.[i] ?? 0
            const is  = axes[i] ?? 0
            const delta = Math.abs(is - was)
            if (delta > deadzone) score += (delta - deadzone) * axisWeight
        }

        // Important: No timestamp bonus (GC adapters tick in idle)
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

            // Snapshot for the next frame
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

        // 1) If the user has a preferred pad → it wins, as long as it's connected
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

        // 2) If we have a currentKey and it's still present → hold it sticky
        if (currentKey && isPresent(pads, currentKey)) {
            const curr = pads.find(p => keyOf(p) === currentKey)
            // Is there a serious challenger?
            if (best && keyOf(best) !== currentKey && bestScore >= minScore) {
                // how many activity does the current pad have?
                const currPrev = prevRef.get(curr.index)
                const currScore = activityScore(currPrev, curr)

                if (bestScore >= currScore + scoreMargin) {
                    // same challenger as last frame?
                    if (challengerKey === keyOf(best)) {
                        challengerFrames++
                    } else {
                        challengerKey = keyOf(best)
                        challengerFrames = 1
                    }

                    // Only switch if stable better
                    if (challengerFrames >= switchDebounceFrames) {
                        currentKey = challengerKey
                        holdUntil = t + holdMs
                        challengerKey = ''
                        challengerFrames = 0
                        return pads.find(p => keyOf(p) === currentKey) || null
                    }
                } else {
                    // reset debounce if needed
                    challengerKey = ''
                    challengerFrames = 0
                }
            } else {
                // no challenger → reset debounce
                challengerKey = ''
                challengerFrames = 0
            }

            // keep currentKey and holdUntil as is (may extend hold time)
            return curr
        }

        // 3) No currentKey? If there's real activity, claim one.
        if (best && bestScore >= minScore) {
            currentKey = keyOf(best)
            holdUntil = t + holdMs
            challengerKey = ''
            challengerFrames = 0
            return best
        }

        // 4) Fail safe: recent pad still connected → keep it
        if (currentKey && t < holdUntil && isPresent(pads, currentKey)) {
            return pads.find(p => keyOf(p) === currentKey) || null
        }

        // 5) nothing is active
        return null
    }
}
