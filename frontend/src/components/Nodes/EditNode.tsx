import {
  Button,
  ButtonGroup,
  DialogActionTrigger,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type ReactNode, useMemo, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaExchangeAlt } from "react-icons/fa"
import { NodesService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import type { NodePublic } from "@/client/types.gen"
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
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface EditNodeProps {
  node: NodePublic
  trigger?: ReactNode
  isOpen?: boolean
  onClose?: () => void
}
interface NodeUpdateForm {
  name: string
  ip: string
  description?: string
  tags?: string
}

const EditNode = ({
  node,
  trigger,
  isOpen: controlledOpen,
  onClose,
}: EditNodeProps) => {
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
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NodeUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      ...node,
      description: node.description ?? undefined,
      tags: node.tags ?? undefined,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: NodeUpdateForm) =>
      NodesService.updateNode({ id: node.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("节点更新成功")
      reset()
      closeDialog()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes"] })
    },
  })

  const onSubmit: SubmitHandler<NodeUpdateForm> = async (data) => {
    mutation.mutate(data)
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
      <Button variant="ghost">
        <FaExchangeAlt fontSize="16px" />
        Edit Node
      </Button>
    )
  }, [isControlled, trigger])

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      {triggerNode && <DialogTrigger asChild>{triggerNode}</DialogTrigger>}
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Node</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>更新节点信息</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="Name"
              >
                <Input
                  {...register("name", { required: "Name is required" })}
                  placeholder="Name"
                  type="text"
                />
              </Field>
              <Field
                required
                invalid={!!errors.ip}
                errorText={errors.ip?.message}
                label="IP"
              >
                <Input
                  {...register("ip", { required: "IP is required" })}
                  placeholder="192.168.x.x"
                  type="text"
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
                  placeholder="tag1,tag2"
                  type="text"
                />
              </Field>
            </VStack>
          </DialogBody>
          <DialogFooter gap={2}>
            <ButtonGroup>
              <DialogActionTrigger asChild>
                <Button
                  variant="subtle"
                  colorPalette="gray"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button variant="solid" type="submit" loading={isSubmitting}>
                Save
              </Button>
            </ButtonGroup>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default EditNode
