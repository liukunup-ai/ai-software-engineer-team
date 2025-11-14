import { Button, DialogActionTrigger, DialogTitle, Input, Text, VStack } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaPlus } from "react-icons/fa"

import { type NodeCreate, NodesService } from "@/client/nodes.service"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTrigger } from "../ui/dialog"
import { Field } from "../ui/field"

const AddNode = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const { register, handleSubmit, reset, formState: { errors, isValid, isSubmitting } } = useForm<NodeCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: { name: "", ip: "", description: "", tags: "", status: "offline" }
  })

  const mutation = useMutation({
  mutationFn: (data: NodeCreate) => NodesService.createNode(data),
    onSuccess: () => {
      showSuccessToast("节点创建成功")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => { handleError(err) },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["nodes"] }) }
  })

  const onSubmit: SubmitHandler<NodeCreate> = (data) => { mutation.mutate(data) }

  return (
    <DialogRoot size={{ base: "xs", md: "md" }} placement="center" open={isOpen} onOpenChange={({ open }) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button value="add-node" my={4}>
          <FaPlus fontSize="16px" />
          Add Node
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Node</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>填写节点信息</Text>
            <VStack gap={4}>
              <Field required invalid={!!errors.name} errorText={errors.name?.message} label="Name">
                <Input {...register("name", { required: "Name is required" })} placeholder="Name" type="text" />
              </Field>
              <Field required invalid={!!errors.ip} errorText={errors.ip?.message} label="IP">
                <Input {...register("ip", { required: "IP is required" })} placeholder="192.168.1.10" type="text" />
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
            <DialogActionTrigger asChild>
              <Button variant="subtle" colorPalette="gray" disabled={isSubmitting}>Cancel</Button>
            </DialogActionTrigger>
            <Button variant="solid" type="submit" disabled={!isValid} loading={isSubmitting}>Save</Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddNode
