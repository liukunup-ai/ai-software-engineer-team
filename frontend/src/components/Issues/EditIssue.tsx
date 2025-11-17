import {
  Button,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type ApiError, type IssuePublic, IssuesService } from "@/client"
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
  DialogActionTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

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
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors, isDirty, isValid },
  } = useForm<IssueUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: issue.title,
      description: issue.description || "",
      repository_url: issue.repository_url || "",
      issue_number: issue.issue_number || undefined,
      priority: issue.priority || 0,
      status: issue.status || "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: IssueUpdateForm) =>
      IssuesService.updateIssue({ id: issue.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Issue updated successfully.")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
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
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && onCancel()}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Issue</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.title}
                errorText={errors.title?.message}
                label="Title"
              >
                <Input
                  {...register("title")}
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
              <Field
                invalid={!!errors.status}
                errorText={errors.status?.message}
                label="Status"
              >
                <Input
                  {...register("status")}
                  placeholder="Status"
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

export default EditIssue
