import React, {useEffect} from 'react'
import {L8N} from "@/lib/Localization";
import '@/styles/components/HelpPanel.css'

/**
 * Help panel component.
 * @param open
 * @param onClose
 * @param title
 * @returns {JSX.Element|null}
 * @constructor
 */
export default function HelpPanel({open, onClose}) {
    useEffect(() => {
        if (!open) {
            return
        }
        const onKey = e => {
            if (e.key === 'Escape') {
                onClose?.()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) {
        return null
    }

    return (
        <div className="help-backdrop" onClick={onClose}>
            <aside className="help-panel" onClick={e => e.stopPropagation()}>
                <header className="help-header">
                    <h2>{L8N.get('help.title')}</h2>
                    <button type="button" className="help-close" onClick={onClose} aria-label="Close">×</button>
                </header>
                <div className="help-body">
                    <h3>{L8N.get('help.controls')}</h3>
                    <ul>
                        <li>{L8N.get('press_key_or_stick')}</li>
                        <li>{L8N.get('help.change_device')}</li>
                        <li>{L8N.get('help.debug_toggle')}</li>
                    </ul>
                    <h3>{L8N.get('help.troubleshoot')}</h3>
                    <ul>
                        <li>{L8N.get('help.browser_input')}</li>
                        <li>{L8N.get('help.usb')}</li>
                    </ul>
                    <hr />
                    <div>
                        Version: 0.2.0 | Author: <a href={"https://zamperia.de"}>Zam</a> | <a href={"https://github.com/Zamperator/ControllersOverlay"}>Source</a>
                    </div>
                </div>
            </aside>
        </div>
    )
}
