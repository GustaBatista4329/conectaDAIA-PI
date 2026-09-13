import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

// Sem <PopoverPrimitive.Portal>, de propósito: quando o Popover nasce dentro
// de um Dialog, o conteúdo portalizado cai fora da árvore DOM que o
// focus-trap do Dialog considera "dentro" — o Dialog então rouba o foco de
// volta a cada tentativa de foco no Popover (o Combobox, por baixo, nunca
// conseguia focar o campo de busca). Sem portal, o conteúdo é descendente
// normal do Dialog (ou de onde o Popover estiver), e `position: fixed`
// continua funcionando normalmente — só quebraria se algum ancestral tivesse
// `transform`/`filter`, o que o Dialog não tem mais (ver dialog.tsx).
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'start', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      'z-50 w-72 rounded-md border border-border bg-popover p-0 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      className,
    )}
    {...props}
  />
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
