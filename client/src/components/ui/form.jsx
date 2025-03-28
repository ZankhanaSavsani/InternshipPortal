import React from 'react'
import { cn } from "../../lib/utils"

const Form = React.forwardRef(({ className, form, ...props }, ref) => {
  return (
    <form 
      ref={ref} 
      className={cn("grid gap-4", className)} 
      {...form} 
      {...props} 
    />
  )
})
Form.displayName = "Form"

const FormItem = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div 
      ref={ref} 
      className={cn("space-y-2", className)} 
      {...props} 
    />
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <label 
      ref={ref} 
      className={cn("block text-sm font-medium text-gray-700", className)} 
      {...props} 
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div 
      ref={ref} 
      className={cn("", className)} 
      {...props} 
    />
  )
})
FormControl.displayName = "FormControl"

const FormMessage = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-red-500 mt-1", className)}
      {...props}
    />
  )
})
FormMessage.displayName = "FormMessage"

const FormField = ({ control, name, render }) => {
  return render({ field: control.register(name) })
}

export { 
  Form, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage,
  FormField
}