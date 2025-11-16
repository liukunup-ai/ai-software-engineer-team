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

import { type ApiError, IssuesService } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

interface AddIssueProps {
  isOpen: boolean
  onClose: () => void
}

interface IssueCreateForm {
  title: string
  description?: string
  repository_url?: string
  issue_number?: number
  priority?: number
}

const AddIssue = ({ isOpen, onClose }: AddIssueProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IssueCreateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
      description: "",
      repository_url: "",
      priority: 0,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: IssueCreateForm) =>
      IssuesService.createIssue({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "Issue created successfully.", "success")
      reset()
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] })
    },
  })

  const onSubmit: SubmitHandler<IssueCreateForm> = (data) => {
    mutation.mutate(data)
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
          <ModalHeader>Add Issue</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isRequired isInvalid={!!errors.title}>
              <FormLabel htmlFor="title">Title</FormLabel>
              <Input
                id="title"
                {...register("title", {
                  required: "Title is required.",
                })}
                placeholder="Issue title"
                type="text"
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel htmlFor="description">Description</FormLabel>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Issue description"
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel htmlFor="repository_url">Repository URL</FormLabel>
              <Input
                id="repository_url"
                {...register("repository_url")}
                placeholder="https://github.com/user/repo"
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
                placeholder="123"
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
                placeholder="0"
                type="number"
                defaultValue={0}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter gap={3}>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default AddIssue
