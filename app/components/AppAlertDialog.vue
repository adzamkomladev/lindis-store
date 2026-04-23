<script setup lang="ts">
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-vue-next'

const { alertState, closeAlert } = useAlertDialog()

const iconMap = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle
}

const iconColorMap = {
  default: 'text-blue-600 bg-blue-100',
  success: 'text-emerald-600 bg-emerald-100',
  error: 'text-red-600 bg-red-100',
  warning: 'text-amber-600 bg-amber-100'
}

const handleConfirm = () => {
  if (alertState.value.onConfirm) {
    alertState.value.onConfirm()
  } else {
    closeAlert()
  }
}

const handleCancel = () => {
  if (alertState.value.onCancel) {
    alertState.value.onCancel()
  } else {
    closeAlert()
  }
}
</script>

<template>
  <AlertDialog :open="alertState.isOpen" @update:open="val => !val && handleCancel()">
    <AlertDialogContent class="max-w-md">
      <AlertDialogHeader>
        <div class="flex items-start gap-4">
          <div 
            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            :class="iconColorMap[alertState.variant]"
          >
            <component :is="iconMap[alertState.variant]" class="w-5 h-5" />
          </div>
          <div class="flex-1 pt-1">
            <AlertDialogTitle class="text-lg font-semibold text-foreground">
              {{ alertState.title }}
            </AlertDialogTitle>
            <AlertDialogDescription v-if="alertState.description" class="mt-2 text-muted-foreground">
              {{ alertState.description }}
            </AlertDialogDescription>
          </div>
        </div>
      </AlertDialogHeader>
      <AlertDialogFooter class="mt-4">
        <AlertDialogCancel 
          v-if="alertState.showCancel" 
          @click="handleCancel"
          class="border-border"
        >
          {{ alertState.cancelText }}
        </AlertDialogCancel>
        <AlertDialogAction 
          @click="handleConfirm"
          :class="alertState.variant === 'error' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'"
        >
          {{ alertState.confirmText }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
