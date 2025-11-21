import {
  Button,
  DialogActionTrigger,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"

import {
  type CredentialCategory,
  type CredentialPublic,
  CredentialsService,
  type CredentialUpdate,
  NodesService,
} from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import { CREDENTIAL_CATEGORY_OPTIONS } from "@/constants/credentials"
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
} from "../ui/dialog"
import { Field } from "../ui/field"
import { Checkbox } from "../ui/checkbox"
import { Radio, RadioGroup } from "../ui/radio"

interface EditCredentialProps {
  credential: CredentialPublic
  isOpen: boolean
  onClose: () => void
}

const EditCredential = ({
  credential,
  isOpen,
  onClose,
}: EditCredentialProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = useForm<CredentialUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: credential.title,
      category: credential.category,
      pat: credential.pat,
      is_disabled: credential.is_disabled,
      node_ids: credential.nodes?.map((node) => node.id) ?? [],
    },
  })

  const nodesQuery = useQuery({
    queryKey: ["nodes", "options"],
    queryFn: () => NodesService.readNodes({ skip: 0, limit: 100 }),
  })
  const nodes = nodesQuery.data?.data ?? []

  const mutation = useMutation({
    mutationFn: (data: CredentialUpdate) =>
      CredentialsService.updateCredential({
        id: credential.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Credential updated successfully.")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] })
    },
  })

  const onSubmit: SubmitHandler<CredentialUpdate> = (data) => {
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
            <DialogTitle>Edit Credential</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the credential and node assignments.</Text>
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
                  placeholder="Title"
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.category}
                errorText={errors.category?.message}
                label="Category"
              >
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: "Category is required." }}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value ?? "github-copilot"}
                      onValueChange={({ value }) =>
                        field.onChange(
                          (value ?? "github-copilot") as CredentialCategory,
                        )
                      }
                    >
                      <SimpleGrid columns={{ base: 1, md: 3 }} gap={2}>
                        {CREDENTIAL_CATEGORY_OPTIONS.map((option) => (
                          <Radio key={option.value} value={option.value}>
                            {option.label}
                          </Radio>
                        ))}
                      </SimpleGrid>
                    </RadioGroup>
                  )}
                />
              </Field>

              <Field
                required
                invalid={!!errors.pat}
                errorText={errors.pat?.message}
                label="Personal Access Token"
              >
                <Input
                  {...register("pat", {
                    required: "Token is required.",
                  })}
                  placeholder="ghp_..."
                  type="password"
                />
              </Field>

              <Field label="Disable Credential">
                <Controller
                  control={control}
                  name="is_disabled"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={({ checked }) =>
                        field.onChange(!!checked)
                      }
                    >
                      Temporarily disable this credential
                    </Checkbox>
                  )}
                />
              </Field>

              <Field label="Used by Nodes">
                {nodesQuery.isLoading ? (
                  <Spinner size="sm" />
                ) : nodesQuery.isError ? (
                  <Text color="red.500">Failed to load nodes.</Text>
                ) : nodes.length === 0 ? (
                  <Text color="fg.muted">No nodes available yet.</Text>
                ) : (
                  <Controller
                    name="node_ids"
                    control={control}
                    render={({ field }) => {
                      const selected = field.value ?? []

                      const toggleNode = (nodeId: string, checked: boolean) => {
                        const next = checked
                          ? [...selected, nodeId]
                          : selected.filter((value) => value !== nodeId)
                        field.onChange(next)
                      }

                      return (
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
                          {nodes.map((node) => (
                            <Checkbox
                              key={node.id}
                              checked={selected.includes(node.id)}
                              onCheckedChange={({ checked }) =>
                                toggleNode(node.id, !!checked)
                              }
                            >
                              {node.name}
                            </Checkbox>
                          ))}
                        </SimpleGrid>
                      )
                    }}
                  />
                )}
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

export default EditCredential
