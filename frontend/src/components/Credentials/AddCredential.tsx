import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { FaPlus } from "react-icons/fa"

import {
  type CredentialCategory,
  type CredentialCreate,
  CredentialsService,
  NodesService,
} from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import { CREDENTIAL_CATEGORY_OPTIONS } from "@/constants/credentials"
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
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"
import { Radio, RadioGroup } from "../ui/radio"

const AddCredential = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CredentialCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
      category: "github-copilot" as CredentialCategory,
      pat: "",
      is_disabled: false,
      node_ids: [],
    },
  })

  const nodesQuery = useQuery({
    queryKey: ["nodes", "options"],
    queryFn: () => NodesService.readNodes({ skip: 0, limit: 100 }),
  })
  const nodes = nodesQuery.data?.data ?? []

  const mutation = useMutation({
    mutationFn: (data: CredentialCreate) =>
      CredentialsService.createCredential({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Credential created successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] })
    },
  })

  const onSubmit: SubmitHandler<CredentialCreate> = (data) => {
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
        <Button value="add-credential" my={4}>
          <FaPlus fontSize="16px" />
          Add Credential
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Credential</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Provide token details and select where it can run.
            </Text>
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
                    minLength: {
                      value: 8,
                      message: "Must be at least 8 characters.",
                    },
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

export default AddCredential
