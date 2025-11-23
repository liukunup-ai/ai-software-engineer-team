import { Button, DialogActionTrigger, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { PromptsService } from "@/client"
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
  DialogTitle,
} from "../ui/dialog"

interface DeletePromptProps {
  id: string
  name: string
  isOpen: boolean
  onClose: () => void
}

const DeletePrompt = ({ id, name, isOpen, onClose }: DeletePromptProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () => PromptsService.deletePrompt({ id }),
    onSuccess: () => {
      showSuccessToast("Prompt deleted successfully.")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] })
    },
  })

  const onSubmit = () => {
    mutation.mutate()
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "sm" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Prompt</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Text>
            Are you sure you want to delete the prompt "{name}"? This action
            cannot be undone.
          </Text>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button
              variant="subtle"
              colorPalette="gray"
              disabled={mutation.isPending}
              onClick={onClose}
            >
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button
            variant="solid"
            colorPalette="red"
            onClick={onSubmit}
            disabled={mutation.isPending}
            loading={mutation.isPending}
          >
            Delete
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default DeletePrompt
