import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaPlus } from "react-icons/fa"

import { type ApiError, IssuesService } from "@/client"
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

interface IssueCreateForm {
  title: string
  description?: string
  repository_url?: string
  issue_number?: number
  priority?: number
}

const AddIssue = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
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
      showSuccessToast("Issue created successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] })
    },
  })

  const onSubmit: SubmitHandler<IssueCreateForm> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button value="add-issue" my={4}>
          <FaPlus fontSize="16px" />
          Add Issue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Issue</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the details to add a new issue.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.title}
                errorText={errors.title?.message}
                label="Title"
              >
                <Input
                  {...register("title", {
                    required: "Title is required.",
                  })}
                  placeholder="Issue title"
                  type="text"
                />
              </Field>
              <Field
                invalid={!!errors.description}
                errorText={errors.description?.message}
                label="Description"
              >
                <Textarea
                  {...register("description")}
                  placeholder="Issue description"
                />
              </Field>
              <Field
                invalid={!!errors.repository_url}
                errorText={errors.repository_url?.message}
                label="Repository URL"
              >
                <Input
                  {...register("repository_url")}
                  placeholder="https://github.com/user/repo"
                  type="text"
                />
              </Field>
              <Field
                invalid={!!errors.issue_number}
                errorText={errors.issue_number?.message}
                label="Issue Number"
              >
                <Input
                  {...register("issue_number", {
                    valueAsNumber: true,
                  })}
                  placeholder="123"
                  type="number"
                />
              </Field>
              <Field
                invalid={!!errors.priority}
                errorText={errors.priority?.message}
                label="Priority"
              >
                <Input
                  {...register("priority", {
                    valueAsNumber: true,
                  })}
                  placeholder="0"
                  type="number"
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
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
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

export default AddIssue
