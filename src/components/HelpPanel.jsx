import React, {useEffect} from 'react'
import '@/styles/components/HelpPanel.css'

/**
 * Help panel component.
 * @param open
 * @param onClose
 * @param title
 * @param children
 * @returns {JSX.Element|null}
 * @constructor
 */
export default function HelpPanel({open, onClose, title = 'Hilfe', children}) {
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
                    <h2>{title}</h2>
                    <button type="button" className="help-close" onClick={onClose} aria-label="Close">×</button>
                </header>
                <div className="help-body">
                    {children}
                </div>
            </aside>
        </div>
    )
}
