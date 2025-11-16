import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
  Textarea,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  type PromptUpdate,
  type PromptPublic,
  PromptsService,
} from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface EditPromptProps {
  prompt: PromptPublic
  isOpen: boolean
  onClose: () => void
}

const EditPrompt = ({ prompt, isOpen, onClose }: EditPromptProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = useForm<PromptUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: prompt.name,
      content: prompt.content,
      description: prompt.description || "",
      tags: prompt.tags || "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: PromptUpdate) =>
      PromptsService.updatePrompt({
        id: prompt.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Prompt updated successfully.")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] })
    },
  })

  const onSubmit: SubmitHandler<PromptUpdate> = (data) => {
    mutation.mutate(data)
  }

  const onCancel = () => {
    reset()
    onClose()
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) {
          onCancel()
        }
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Edit the prompt details.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="Name"
              >
                <Input
                  {...register("name", {
                    required: "Name is required.",
                  })}
                  placeholder="Prompt Name"
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.content}
                errorText={errors.content?.message}
                label="Content"
              >
                <Textarea
                  {...register("content", {
                    required: "Content is required.",
                  })}
                  placeholder="Prompt content"
                  rows={6}
                />
              </Field>

              <Field
                invalid={!!errors.description}
                errorText={errors.description?.message}
                label="Description"
              >
                <Input
                  {...register("description")}
                  placeholder="Description"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.tags}
                errorText={errors.tags?.message}
                label="Tags"
              >
                <Input
                  {...register("tags")}
                  placeholder="tag1,tag2,tag3"
                  type="text"
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
                onClick={onCancel}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isDirty || !isValid}
              loading={isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default EditPrompt