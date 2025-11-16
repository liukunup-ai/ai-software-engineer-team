import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type ApiError, type IssuePublic, IssuesService } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

interface EditIssueProps {
  issue: IssuePublic
  isOpen: boolean
  onClose: () => void
}

interface IssueUpdateForm {
  title?: string
  description?: string
  repository_url?: string
  issue_number?: number
  priority?: number
  status?: string
}

const EditIssue = ({ issue, isOpen, onClose }: EditIssueProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<IssueUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: issue,
  })

  const mutation = useMutation({
    mutationFn: (data: IssueUpdateForm) =>
      IssuesService.updateIssue({ id: issue.id, requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "Issue updated successfully.", "success")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] })
    },
  })

  const onSubmit: SubmitHandler<IssueUpdateForm> = (data) => {
    mutation.mutate(data)
  }

  const onCancel = () => {
    reset()
    onClose()
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{ base: "sm", md: "md" }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Edit Issue</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isInvalid={!!errors.title}>
              <FormLabel htmlFor="title">Title</FormLabel>
              <Input
                id="title"
                {...register("title")}
                type="text"
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel htmlFor="description">Description</FormLabel>
              <Textarea
                id="description"
                {...register("description")}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel htmlFor="repository_url">Repository URL</FormLabel>
              <Input
                id="repository_url"
                {...register("repository_url")}
                type="text"
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel htmlFor="issue_number">Issue Number</FormLabel>
              <Input
                id="issue_number"
                {...register("issue_number", {
                  valueAsNumber: true,
                })}
                type="number"
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel htmlFor="priority">Priority</FormLabel>
              <Input
                id="priority"
                {...register("priority", {
                  valueAsNumber: true,
                })}
                type="number"
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel htmlFor="status">Status</FormLabel>
              <Input
                id="status"
                {...register("status")}
                type="text"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default EditIssue
