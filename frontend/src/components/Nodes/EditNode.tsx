import { Button, ButtonGroup, DialogActionTrigger, Input, Text, VStack } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaExchangeAlt } from "react-icons/fa"

import type { ApiError } from "@/client/core/ApiError"
import { type NodePublic, NodesService } from "@/client/nodes.service"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Field } from "../ui/field"

interface EditNodeProps { node: NodePublic }
interface NodeUpdateForm { name: string; ip: string; description?: string; tags?: string }

const EditNode = ({ node }: EditNodeProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NodeUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: { ...node, description: node.description ?? undefined, tags: node.tags ?? undefined }
  })

  const mutation = useMutation({
  mutationFn: (data: NodeUpdateForm) => NodesService.updateNode(node.id, data),
    onSuccess: () => { showSuccessToast("节点更新成功"); reset(); setIsOpen(false) },
    onError: (err: ApiError) => { handleError(err) },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["nodes"] }) }
  })

  const onSubmit: SubmitHandler<NodeUpdateForm> = async (data) => { mutation.mutate(data) }

  return (
    <DialogRoot size={{ base: "xs", md: "md" }} placement="center" open={isOpen} onOpenChange={({ open }) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <FaExchangeAlt fontSize="16px" />
          Edit Node
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Node</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>更新节点信息</Text>
            <VStack gap={4}>
              <Field required invalid={!!errors.name} errorText={errors.name?.message} label="Name">
                <Input {...register("name", { required: "Name is required" })} placeholder="Name" type="text" />
              </Field>
              <Field required invalid={!!errors.ip} errorText={errors.ip?.message} label="IP">
                <Input {...register("ip", { required: "IP is required" })} placeholder="192.168.x.x" type="text" />
              </Field>
              <Field invalid={!!errors.description} errorText={errors.description?.message} label="Description">
                <Input {...register("description")} placeholder="Description" type="text" />
              </Field>
              <Field invalid={!!errors.tags} errorText={errors.tags?.message} label="Tags">
                <Input {...register("tags")} placeholder="tag1,tag2" type="text" />
              </Field>
            </VStack>
          </DialogBody>
          <DialogFooter gap={2}>
            <ButtonGroup>
              <DialogActionTrigger asChild>
                <Button variant="subtle" colorPalette="gray" disabled={isSubmitting}>Cancel</Button>
              </DialogActionTrigger>
              <Button variant="solid" type="submit" loading={isSubmitting}>Save</Button>
            </ButtonGroup>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default EditNode
