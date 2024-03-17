"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

const FormSchema = z.object({
  prompt: z.string().min(2, {
    message: "Prompt must be at least 2 characters.",
  }),
})

export function InputForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prompt: "",
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    // Log the submitted data to the console
    console.log("Submitted data:", data);

    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <Form {...form} className="flex w-full fixed bottom-0 items-center space-x-2 max-w-md p-2 mb-8">
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full space-y-6">
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input className="fixed bottom-14 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl" placeholder="Input ad angle" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="fixed bottom-5 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl" type="submit">Submit</Button>
      </form>
    </Form>
  )
}

export default InputForm;
