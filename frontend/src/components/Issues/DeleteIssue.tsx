import { Button, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { type ApiError, IssuesService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../ui/dialog"

interface DeleteIssueProps {
  id: string
  isOpen: boolean
  onClose: () => void
}

const DeleteIssue = ({ id, isOpen, onClose }: DeleteIssueProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () => IssuesService.deleteIssue({ id }),
    onSuccess: () => {
      showSuccessToast("Issue deleted successfully.")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] })
    },
  })

  const onDelete = () => {
    mutation.mutate()
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "sm" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Issue</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Text>Are you sure you want to delete this issue?</Text>
          <Text color="red.600" mt={2}>
            This action cannot be undone.
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
            onClick={onDelete}
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

export default DeleteIssue
