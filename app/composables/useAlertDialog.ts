import { ref } from 'vue'

export interface AlertState {
  isOpen: boolean
  title: string
  description: string
  variant: 'default' | 'success' | 'error' | 'warning'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  showCancel?: boolean
}

const alertState = ref<AlertState>({
  isOpen: false,
  title: '',
  description: '',
  variant: 'default',
  confirmText: 'OK',
  cancelText: 'Cancel',
  showCancel: false
})

export const useAlertDialog = () => {
  const showAlert = (options: {
    title: string
    description: string
    variant?: 'default' | 'success' | 'error' | 'warning'
    confirmText?: string
  }) => {
    alertState.value = {
      isOpen: true,
      title: options.title,
      description: options.description,
      variant: options.variant || 'default',
      confirmText: options.confirmText || 'OK',
      showCancel: false
    }
  }

  const showSuccess = (title: string, description: string = '') => {
    showAlert({ title, description, variant: 'success' })
  }

  const showError = (title: string, description: string = '') => {
    showAlert({ title, description, variant: 'error' })
  }

  const showWarning = (title: string, description: string = '') => {
    showAlert({ title, description, variant: 'warning' })
  }

  const confirm = (options: {
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'success' | 'error' | 'warning'
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      alertState.value = {
        isOpen: true,
        title: options.title,
        description: options.description,
        variant: options.variant || 'default',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        showCancel: true,
        onConfirm: () => {
          alertState.value.isOpen = false
          resolve(true)
        },
        onCancel: () => {
          alertState.value.isOpen = false
          resolve(false)
        }
      }
    })
  }

  const closeAlert = () => {
    alertState.value.isOpen = false
  }

  return {
    alertState,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    confirm,
    closeAlert
  }
}
