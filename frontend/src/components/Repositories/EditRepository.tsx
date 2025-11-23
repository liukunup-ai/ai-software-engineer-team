import {
  Button,
  DialogActionTrigger,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"

import {
  RepositoriesService,
  type RepositoryPublic,
  type RepositoryUpdate,
} from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { Checkbox } from "../ui/checkbox"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface EditRepositoryProps {
  repository: RepositoryPublic
  isOpen: boolean
  onClose: () => void
}

const EditRepository = ({
  repository,
  isOpen,
  onClose,
}: EditRepositoryProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = useForm<RepositoryUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: repository.name,
      url: repository.url,
      description: repository.description || "",
      is_public: repository.is_public,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: RepositoryUpdate) =>
      RepositoriesService.updateRepository({
        id: repository.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Repository updated successfully.")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] })
    },
  })

  const onSubmit: SubmitHandler<RepositoryUpdate> = (data) => {
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
      onOpenChange={({ open }) => {
        if (!open) {
          onCancel()
        }
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Repository</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Edit the repository details.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="Name"
              >
                <Input
                  {...register("name", {
                    required: "Name is required.",
                  })}
                  placeholder="Repository Name"
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.url}
                errorText={errors.url?.message}
                label="URL"
              >
                <Input
                  {...register("url", {
                    required: "URL is required.",
                  })}
                  placeholder="https://github.com/user/repo"
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
                invalid={!!errors.is_public}
                errorText={errors.is_public?.message}
                label="Public Repository"
              >
                <Controller
                  control={control}
                  name="is_public"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={({ checked }) => field.onChange(checked)}
                    >
                      Is public?
                    </Checkbox>
                  )}
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

export default EditRepository
