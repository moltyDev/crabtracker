import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="bg-card border-primary/50 shadow-[0_0_20px_rgba(255,221,0,0.2)] font-mono rounded-none">
            <div className="grid gap-1">
              {title && <ToastTitle className="text-primary font-display font-bold tracking-widest">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-muted-foreground">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="text-primary hover:text-primary/80" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
