import { Button, DialogTitle, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type ReactNode, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { FiTrash2 } from "react-icons/fi"

import { NodesService } from "@/client"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog"
import useCustomToast from "@/hooks/useCustomToast"

interface DeleteNodeProps {
  id: string
  trigger?: ReactNode
  isOpen?: boolean
  onClose?: () => void
}

const DeleteNode = ({
  id,
  trigger,
  isOpen: controlledOpen,
  onClose,
}: DeleteNodeProps) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const closeDialog = () => {
    if (isControlled) {
      onClose?.()
    } else {
      setInternalOpen(false)
    }
  }
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()

  const deleteNode = async (id: string) => {
    await NodesService.deleteNode({ id })
  }

  const mutation = useMutation({
    mutationFn: deleteNode,
    onSuccess: () => {
      showSuccessToast("节点删除成功")
      closeDialog()
    },
    onError: () => {
      showErrorToast("删除节点失败")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes"] })
    },
  })

  const onSubmit = async () => {
    mutation.mutate(id)
  }

  const handleOpenChange = ({ open }: { open: boolean }) => {
    if (isControlled) {
      if (!open) {
        onClose?.()
      }
    } else {
      setInternalOpen(open)
    }
  }

  const triggerNode = useMemo(() => {
    if (trigger) return trigger
    if (isControlled) return null
    return (
      <Button variant="ghost" size="sm" colorPalette="red">
        <FiTrash2 fontSize="16px" />
        Delete Node
      </Button>
    )
  }, [isControlled, trigger])

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      role="alertdialog"
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      {triggerNode && <DialogTrigger asChild>{triggerNode}</DialogTrigger>}
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogCloseTrigger />
          <DialogHeader>
            <DialogTitle>Delete Node</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>此操作不可撤销，是否确认删除该节点？</Text>
          </DialogBody>
          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              colorPalette="red"
              type="submit"
              loading={isSubmitting}
            >
              Delete
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default DeleteNode
