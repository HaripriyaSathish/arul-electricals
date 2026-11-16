/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from 'react'
import Modal from './Modal'
import Icon from '../../components/common/Icon'

const ConfirmContext = createContext(null)

/**
 * const confirm = useConfirm()
 * if (await confirm({ title, message, confirmText, danger: true })) { ... }
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)

  const confirm = useCallback((opts) => new Promise((resolve) => {
    setState({ confirmText: 'Confirm', cancelText: 'Cancel', ...opts, resolve })
  }), [])

  const close = (result) => {
    state?.resolve(result)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        onClose={() => close(false)}
        size="sm"
        footer={state && (
          <>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={() => close(false)}>{state.cancelText}</button>
            <button type="button" autoFocus className={`adm-btn ${state.danger ? 'adm-btn--danger' : 'adm-btn--primary'}`} onClick={() => close(true)}>
              {state.confirmText}
            </button>
          </>
        )}
      >
        {state && (
          <div className="adm-confirm">
            <div className={`adm-confirm__icon ${state.danger ? 'is-danger' : ''}`}>
              <Icon name={state.icon || (state.danger ? 'trash' : 'info')} size={22} />
            </div>
            <div>
              <h3>{state.title}</h3>
              {state.message && <div className="adm-confirm__msg">{state.message}</div>}
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmContext)
