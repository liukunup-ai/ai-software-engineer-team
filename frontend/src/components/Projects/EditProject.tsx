import {
  Button,
  DialogActionTrigger,
  Input,
  Text,
  Textarea,
  VStack,
  HStack,
  IconButton,
  Box,
} from "@chakra-ui/react"
import React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import { type ProjectUpdate, ProjectPublic, ProjectsService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../ui/dialog"
import { FiX, FiPlus } from "react-icons/fi"
import { Field } from "../ui/field"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

interface EditProjectProps {
  project: ProjectPublic
  isOpen: boolean
  onClose: () => void
}

const EditProject = ({ project, isOpen, onClose }: EditProjectProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [repositories, setRepositories] = React.useState<string[]>(
    (project as any).repository_urls || []
  )
  const MAX_REPOSITORIES = 20

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = useForm<ProjectUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: project.name,
      description: project.description || "",
    },
  })

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
    mutationFn: (data: ProjectUpdate) =>
      ProjectsService.updateProject({
        id: project.id,
        requestBody: data,
      }),
    onSuccess: () => {
      showSuccessToast("Project updated successfully.")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  const onSubmit: SubmitHandler<ProjectUpdate> = (data) => {
    const filteredRepos = repositories.filter(url => url.trim() !== "")
    mutation.mutate({
      ...data,
      repository_urls: filteredRepos.length > 0 ? filteredRepos : undefined,
    })
  }

  const onCancel = () => {
    reset()
    setRepositories((project as any).repository_urls || [])
    onClose()
  }

  return (
    <DialogRoot
      size={repositories.length > 10 ? { base: "xl", md: "xl" } : { base: "xs", md: "md" }}
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
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Edit the project details.</Text>
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

              <Field label="Repositories">
                {repositories.length > 10 ? (
                  <Box width="100%">
                    <HStack align="start" gap={4} width="100%">
                      <VStack gap={2} align="stretch" width="50%">
                        {repositories.slice(0, Math.ceil(repositories.length / 2)).map((repo, index) => (
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
                      </VStack>
                      <VStack gap={2} align="stretch" width="50%">
                        {repositories.slice(Math.ceil(repositories.length / 2)).map((repo, index) => (
                          <HStack key={index + Math.ceil(repositories.length / 2)} gap={2}>
                            <Input
                              value={repo}
                              onChange={(e) => updateRepository(index + Math.ceil(repositories.length / 2), e.target.value)}
                              placeholder="https://github.com/user/repo"
                              type="text"
                            />
                            <IconButton
                              aria-label="Remove repository"
                              onClick={() => removeRepository(index + Math.ceil(repositories.length / 2))}
                              size="sm"
                              variant="ghost"
                              colorPalette="red"
                            >
                              <FiX />
                            </IconButton>
                          </HStack>
                        ))}
                      </VStack>
                    </HStack>
                    {repositories.length < MAX_REPOSITORIES ? (
                      <Button
                        onClick={addRepository}
                        size="sm"
                        variant="outline"
                        colorPalette="blue"
                        gap={2}
                        mt={2}
                      >
                        <FiPlus fontSize="16px" />
                        Add Repository
                      </Button>
                    ) : (
                      <Box p={2} bg="blue.50" borderRadius="md" mt={2}>
                        <Text fontSize="xs" color="blue.700">
                          Maximum {MAX_REPOSITORIES} repositories reached.
                        </Text>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <VStack gap={2} align="stretch" width="100%">
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
                          Maximum {MAX_REPOSITORIES} repositories reached. You can add more after saving.
                        </Text>
                      </Box>
                    )}
                  </VStack>
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

export default EditProject