import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

const DropdownMenu = ({ children, trigger }) => {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          className="w-56 bg-white shadow-md rounded-lg animate-in slide-in-from-top-1 z-50"
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};

const RadixDropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const RadixDropdownMenuContent = DropdownMenuPrimitive.Content;

const CustomDropdownMenuItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={`
      relative flex items-center px-2 py-2 text-sm text-gray-700
      outline-none transition-colors focus:bg-gray-100 
      data-[disabled]:pointer-events-none data-[disabled]:opacity-50
      ${className}
    `}
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.Item>
));
CustomDropdownMenuItem.displayName = 'CustomDropdownMenuItem';

const CustomDropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={`-mx-1 my-1 h-px bg-gray-200 ${className}`}
    {...props}
  />
));
CustomDropdownMenuSeparator.displayName = 'CustomDropdownMenuSeparator';

export {
  DropdownMenu,
  RadixDropdownMenuTrigger,
  RadixDropdownMenuContent,
  CustomDropdownMenuItem,
  CustomDropdownMenuSeparator,
};
