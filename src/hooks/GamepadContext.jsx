import React, {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react'

import {makeActiveGamepadPicker} from "@/lib/activeGamepad";

const GamepadCtx = createContext({pads: [], activeKey: '', hasAny: false})

/**
 * GamepadProvider component.
 *
 * @param children
 * @param options
 * @param enabled
 * @returns {JSX.Element}
 * @constructor
 */
export function GamepadProvider({children, options, enabled = true}) {

    const picker = useMemo(() => makeActiveGamepadPicker({
        timeoutMs: options?.timeoutMs ?? 1500,
        deadzone: options?.deadzone ?? .22,
        axisWeight: options?.axisWeight ?? .5,
        minScore: options?.minScore ?? .75
    }), [options])

    const [pads, setPads] = useState([])
    const [activeKey, setActiveKey] = useState('')
    const last = useRef({padsJSON: '[]', activeKey: ''})
    const needRefresh = useRef(true)
    const rafRef = useRef(null)

    // When disabled, clear state and stop any RAF
    useEffect(() => {
        if (!enabled) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
            setPads([])
            setActiveKey('')
            last.current = {padsJSON: '[]', activeKey: ''}
        }
    }, [enabled])

    // Connect/Disconnect only when enabled
    useEffect(() => {
        if (!enabled) {
            return
        }

        const onConnect = () => {
            needRefresh.current = true
        }
        const onDisconnect = () => {
            needRefresh.current = true
        }
        window.addEventListener('gamepadconnected', onConnect)
        window.addEventListener('gamepaddisconnected', onDisconnect)
        return () => {
            window.removeEventListener('gamepadconnected', onConnect)
            window.removeEventListener('gamepaddisconnected', onDisconnect)
        }
    }, [enabled])

    // Polling-Loop only when enabled
    useEffect(() => {
        if (!enabled) {
            return
        }

        const intervalMs = options?.intervalMs ?? 60
        let lastUpdate = 0

        const loop = now => {
            // throttle
            if (!needRefresh.current && (now - lastUpdate) < intervalMs) {
                rafRef.current = requestAnimationFrame(loop)
                return
            }

            // console.log("GamepadContext")

            lastUpdate = now
            needRefresh.current = false

            const raw = navigator.getGamepads?.() || []
            const list = Array.from(raw).filter(Boolean)

            const active = picker(list, options?.preferredKey)
            const newActiveKey = active ? `${active.index}:${active.id}` : ''

            // only update state if something changed (to avoid re-renders)
            const slim = list.map(gp => ({index: gp.index, id: gp.id, mapping: gp.mapping || ''}))
            const padsJSON = JSON.stringify(slim)
            if (padsJSON !== last.current.padsJSON) {
                setPads(list)
                last.current.padsJSON = padsJSON
            }
            if (newActiveKey !== last.current.activeKey) {
                setActiveKey(newActiveKey)
                last.current.activeKey = newActiveKey
            }

            rafRef.current = requestAnimationFrame(loop)
        }

        rafRef.current = requestAnimationFrame(loop)
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
            }
            rafRef.current = null
        }
    }, [enabled, picker, options?.intervalMs, options?.preferredKey])

    const value = useMemo(() => ({
        pads,
        activeKey,
        hasAny: pads.length > 0
    }), [pads, activeKey])

    return (
        <GamepadCtx.Provider value={value}>
            {children}
        </GamepadCtx.Provider>
    )
}

export function useGamepads() {
    return useContext(GamepadCtx)
}
