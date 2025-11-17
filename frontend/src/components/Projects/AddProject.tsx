import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  Textarea,
  VStack,
  HStack,
  IconButton,
  Box,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { FaPlus } from "react-icons/fa"
import { FiX, FiPlus } from "react-icons/fi"

import { type ProjectCreate, ProjectsService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
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
import { Checkbox } from "../ui/checkbox"
import { Field } from "../ui/field"

interface ProjectFormData {
  name: string
  description?: string | null
  is_active?: boolean
  repository_urls?: string[]
}

const AddProject = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [repositories, setRepositories] = useState<string[]>([])
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ProjectFormData>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
    },
  })

  const MAX_REPOSITORIES = 5

  const addRepository = () => {
    if (repositories.length < MAX_REPOSITORIES) {
      setRepositories([...repositories, ""])
    }
  }

  const removeRepository = (index: number) => {
    setRepositories(repositories.filter((_, i) => i !== index))
  }

  const updateRepository = (index: number, value: string) => {
    const newRepos = [...repositories]
    newRepos[index] = value
    setRepositories(newRepos)
  }

  const mutation = useMutation({
    mutationFn: (data: ProjectCreate) =>
      ProjectsService.createProject({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Project created successfully.")
      handleClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  const onSubmit: SubmitHandler<ProjectFormData> = (data) => {
    const filteredRepos = repositories.filter(url => url.trim() !== "")
    mutation.mutate({
      ...data,
      repository_urls: filteredRepos.length > 0 ? filteredRepos : undefined,
    } as ProjectCreate)
  }

  const handleClose = () => {
    reset()
    setRepositories([])
    setIsOpen(false)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button value="add-project" my={4}>
          <FaPlus fontSize="16px" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the details to add a new project.</Text>
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
                  placeholder="Project Name"
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
                  placeholder="Description"
                />
              </Field>

              <Field
                invalid={!!errors.is_active}
                errorText={errors.is_active?.message}
                label="Active"
              >
                <Controller
                  control={control}
                  name="is_active"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={({ checked }) => field.onChange(checked)}
                    >
                      Is active?
                    </Checkbox>
                  )}
                />
              </Field>

              <Field label="Repositories (Optional)">
                <VStack gap={2} align="stretch">
                  {repositories.map((repo, index) => (
                    <HStack key={index} gap={2}>
                      <Input
                        value={repo}
                        onChange={(e) => updateRepository(index, e.target.value)}
                        placeholder="https://github.com/user/repo"
                        type="text"
                      />
                      <IconButton
                        aria-label="Remove repository"
                        onClick={() => removeRepository(index)}
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                      >
                        <FiX />
                      </IconButton>
                    </HStack>
                  ))}
                  {repositories.length < MAX_REPOSITORIES ? (
                    <Button
                      onClick={addRepository}
                      size="sm"
                      variant="outline"
                      colorPalette="blue"
                      gap={2}
                    >
                      <FiPlus fontSize="16px" />
                      Add Repository
                    </Button>
                  ) : (
                    <Box p={2} bg="blue.50" borderRadius="md">
                      <Text fontSize="xs" color="blue.700">
                        Maximum {MAX_REPOSITORIES} repositories reached. You can add more after creating the project.
                      </Text>
                    </Box>
                  )}
                </VStack>
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

export default AddProject