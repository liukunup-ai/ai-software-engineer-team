import {
  Badge,
  Button,
  CloseButton,
  Flex,
  Icon,
  Input,
  Spinner,
  Text,
  Textarea,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { FiCheck, FiChevronDown, FiFolder, FiLink } from "react-icons/fi"

import {
  type ApiError,
  type IssuePublic,
  type IssuesReadIssueResponse,
  type IssuesReadIssuesResponse,
  IssuesService,
  type IssueUpdate,
  type ProjectPublic,
  type ProjectsReadProjectsResponse,
  ProjectsService,
} from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { useDebounce } from "@/hooks/useDebounce"
import { handleError } from "@/utils"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../ui/dialog"
import { Field } from "../ui/field"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"
import { Radio, RadioGroup } from "../ui/radio"

interface EditIssueProps {
  issue: IssuePublic
  isOpen: boolean
  onClose: () => void
}

interface IssueUpdateForm {
  title?: string
  description?: string
  priority?: number
  project_id?: string | null
  repository_url?: string | null
  dependency_issue_ids?: string[]
}

type ProjectOption = Pick<ProjectPublic, "id" | "name" | "description">
type IssueOption = Pick<IssuePublic, "id" | "title" | "issue_number">

const PRIORITY_OPTIONS = [
  { label: "High", helper: "Blocking issues", value: 2, color: "red" },
  { label: "Medium", helper: "Important soon", value: 1, color: "orange" },
  { label: "Low", helper: "Nice to have", value: 0, color: "gray" },
]

const MAX_SEARCH_RESULTS = 20

const EditIssue = ({ issue, isOpen, onClose }: EditIssueProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const formDefaults = useMemo<IssueUpdateForm>(
    () => ({
      title: issue.title,
      description: issue.description || "",
      priority: issue.priority ?? 1,
      project_id: issue.project_id ?? null,
      repository_url: issue.repository_url || "",
      dependency_issue_ids: issue.dependency_issue_ids ?? [],
    }),
    [
      issue.description,
      issue.dependency_issue_ids,
      issue.priority,
      issue.project_id,
      issue.repository_url,
      issue.title,
    ],
  )

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isSubmitting, errors, isDirty, isValid },
  } = useForm<IssueUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: formDefaults,
  })

  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false)
  const [isDependencyMenuOpen, setIsDependencyMenuOpen] = useState(false)
  const [projectSearch, setProjectSearch] = useState("")
  const [dependencySearch, setDependencySearch] = useState("")
  const [selectedProjectOption, setSelectedProjectOption] =
    useState<ProjectOption | null>(null)
  const [selectedDependencies, setSelectedDependencies] = useState<
    IssueOption[]
  >([])

  const projectSearchValue = useDebounce(projectSearch, 300)
  const dependencySearchValue = useDebounce(dependencySearch, 300)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    reset(formDefaults)
  }, [formDefaults, isOpen, reset])

  useEffect(() => {
    if (!isOpen) {
      setSelectedProjectOption(null)
      return
    }

    const currentProjectId = issue.project_id
    if (!currentProjectId) {
      setSelectedProjectOption(null)
      setValue("project_id", null)
      return
    }

    let ignore = false
    ;(async () => {
      try {
        const project = await ProjectsService.readProject({
          id: currentProjectId,
        })
        if (!ignore) {
          setSelectedProjectOption({
            id: project.id,
            name: project.name,
            description: project.description,
          })
          setValue("project_id", project.id)
        }
      } catch (_error) {
        if (!ignore) {
          setSelectedProjectOption(null)
        }
      }
    })()

    return () => {
      ignore = true
    }
  }, [isOpen, issue.project_id, setValue])

  useEffect(() => {
    if (!isOpen) {
      setSelectedDependencies([])
      return
    }

    const dependencyIds = issue.dependency_issue_ids ?? []
    if (dependencyIds.length === 0) {
      setSelectedDependencies([])
      setValue("dependency_issue_ids", [])
      return
    }

    let ignore = false
    ;(async () => {
      try {
        const dependencies = await Promise.all(
          dependencyIds.map(async (id) => IssuesService.readIssue({ id })),
        )
        if (ignore) {
          return
        }
        setSelectedDependencies(
          dependencies.map((dep: IssuesReadIssueResponse) => ({
            id: dep.id,
            title: dep.title,
            issue_number: dep.issue_number,
          })),
        )
        setValue("dependency_issue_ids", dependencyIds)
      } catch (_error) {
        if (!ignore) {
          setSelectedDependencies([])
        }
      }
    })()

    return () => {
      ignore = true
    }
  }, [issue.dependency_issue_ids, isOpen, setValue])

  const projectSearchQuery = useQuery<ProjectsReadProjectsResponse>({
    queryKey: ["projects", "search", projectSearchValue],
    queryFn: () =>
      ProjectsService.readProjects({
        skip: 0,
        limit: MAX_SEARCH_RESULTS,
        search: projectSearchValue || undefined,
      }),
    enabled: isProjectMenuOpen,
    staleTime: 60 * 1000,
    placeholderData: (previousData) => previousData,
  })
  const projectOptions = projectSearchQuery.data?.data ?? []

  const dependencySearchQuery = useQuery<IssuesReadIssuesResponse>({
    queryKey: ["issues", "search", dependencySearchValue],
    queryFn: () =>
      IssuesService.readIssues({
        skip: 0,
        limit: MAX_SEARCH_RESULTS,
        search: dependencySearchValue || undefined,
      }),
    enabled: isDependencyMenuOpen,
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  })
  const dependencyOptions = dependencySearchQuery.data?.data ?? []

  const handleDependencyRemove = useCallback(
    (dependencyId: string, onChange: (value: string[]) => void) => {
      setSelectedDependencies((prev) => {
        const remaining = prev.filter((item) => item.id !== dependencyId)
        onChange(remaining.map((item) => item.id))
        return remaining
      })
    },
    [],
  )

  const resetFormState = useCallback(() => {
    reset(formDefaults)
    setProjectSearch("")
    setDependencySearch("")
    setIsProjectMenuOpen(false)
    setIsDependencyMenuOpen(false)
  }, [formDefaults, reset])

  const mutation = useMutation({
    mutationFn: (data: IssueUpdateForm) => {
      const repositoryUrl = data.repository_url?.trim()
      const payload: IssueUpdate = {
        ...data,
        title: data.title ?? undefined,
        description: data.description || undefined,
        project_id: data.project_id ?? null,
        dependency_issue_ids: data.dependency_issue_ids ?? [],
        repository_url:
          repositoryUrl === undefined
            ? undefined
            : repositoryUrl.length === 0
              ? null
              : repositoryUrl,
      }
      return IssuesService.updateIssue({ id: issue.id, requestBody: payload })
    },
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
    resetFormState()
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
                  {...register("repository_url", {
                    validate: (value) => {
                      if (!value) {
                        return true
                      }
                      return /^https?:\/\/.+/i.test(value)
                        ? true
                        : "Enter a valid URL."
                    },
                  })}
                  placeholder="https://github.com/org/repo"
                  type="url"
                />
              </Field>
              <Field label="Project">
                <Controller
                  control={control}
                  name="project_id"
                  render={({ field }) => (
                    <MenuRoot
                      open={isProjectMenuOpen}
                      onOpenChange={({ open }) => {
                        setIsProjectMenuOpen(open)
                        if (!open) {
                          setProjectSearch("")
                        }
                      }}
                    >
                      <MenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          justifyContent="space-between"
                          w="100%"
                          gap={2}
                        >
                          <Flex align="center" gap={2} flex="1">
                            <Icon as={FiFolder} />
                            <Text truncate>
                              {selectedProjectOption?.name ??
                                "Select a project"}
                            </Text>
                          </Flex>
                          <Icon as={FiChevronDown} />
                        </Button>
                      </MenuTrigger>
                      <MenuContent
                        portalled={false}
                        minW="320px"
                        p={3}
                        shadow="lg"
                        borderRadius="lg"
                      >
                        <VStack align="stretch" gap={3}>
                          <Input
                            placeholder="Search by name or description"
                            value={projectSearch}
                            onChange={(event) =>
                              setProjectSearch(event.target.value)
                            }
                            onClick={(event) => event.stopPropagation()}
                          />
                          {projectSearchQuery.isLoading ? (
                            <Flex
                              align="center"
                              justify="center"
                              py={6}
                              gap={2}
                            >
                              <Spinner size="sm" />
                              <Text fontSize="sm">Loading projects…</Text>
                            </Flex>
                          ) : projectSearchQuery.isError ? (
                            <Text color="red.500" fontSize="sm">
                              Unable to load projects.
                            </Text>
                          ) : projectOptions.length === 0 ? (
                            <Text fontSize="sm" color="fg.muted">
                              No projects found.
                            </Text>
                          ) : (
                            <VStack
                              align="stretch"
                              gap={2}
                              maxH="240px"
                              overflowY="auto"
                            >
                              {projectOptions.map((project) => {
                                const isSelected = field.value === project.id
                                return (
                                  <Button
                                    type="button"
                                    key={project.id}
                                    variant={isSelected ? "solid" : "outline"}
                                    justifyContent="space-between"
                                    onClick={() => {
                                      field.onChange(project.id)
                                      setSelectedProjectOption(project)
                                      setIsProjectMenuOpen(false)
                                    }}
                                  >
                                    <Flex direction="column" align="flex-start">
                                      <Text fontWeight="600">
                                        {project.name}
                                      </Text>
                                      {project.description && (
                                        <Text
                                          fontSize="xs"
                                          color="fg.muted"
                                          truncate
                                        >
                                          {project.description}
                                        </Text>
                                      )}
                                    </Flex>
                                    {isSelected && <Icon as={FiCheck} />}
                                  </Button>
                                )
                              })}
                            </VStack>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            colorPalette="gray"
                            onClick={() => {
                              field.onChange(null)
                              setSelectedProjectOption(null)
                              setIsProjectMenuOpen(false)
                            }}
                          >
                            Clear selection
                          </Button>
                        </VStack>
                      </MenuContent>
                    </MenuRoot>
                  )}
                />
              </Field>
              <Field label="Dependent Issues">
                <Controller
                  control={control}
                  name="dependency_issue_ids"
                  render={({ field }) => (
                    <VStack align="stretch" gap={3}>
                      <MenuRoot
                        open={isDependencyMenuOpen}
                        onOpenChange={({ open }) => {
                          setIsDependencyMenuOpen(open)
                          if (!open) {
                            setDependencySearch("")
                          }
                        }}
                        positioning={{ placement: "bottom-start", gutter: 4 }}
                      >
                        <MenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            justifyContent="space-between"
                            w="100%"
                          >
                            <Flex align="center" gap={2}>
                              <Icon as={FiLink} />
                              <Text fontSize="sm" truncate>
                                {field.value?.length
                                  ? `${field.value.length} issue(s) selected`
                                  : "Add blocking issues"}
                              </Text>
                            </Flex>
                            <Icon as={FiChevronDown} />
                          </Button>
                        </MenuTrigger>
                        <MenuContent
                          portalled={false}
                          minW="360px"
                          p={3}
                          shadow="lg"
                          borderRadius="lg"
                        >
                          <VStack align="stretch" gap={3}>
                            <Input
                              placeholder="Search issue title"
                              value={dependencySearch}
                              onChange={(event) =>
                                setDependencySearch(event.target.value)
                              }
                              onClick={(event) => event.stopPropagation()}
                            />
                            {dependencySearchQuery.isLoading ? (
                              <Flex
                                align="center"
                                justify="center"
                                py={6}
                                gap={2}
                              >
                                <Spinner size="sm" />
                                <Text fontSize="sm">Loading issues…</Text>
                              </Flex>
                            ) : dependencySearchQuery.isError ? (
                              <Text color="red.500" fontSize="sm">
                                Unable to load issues.
                              </Text>
                            ) : dependencyOptions.length === 0 ? (
                              <Text fontSize="sm" color="fg.muted">
                                No issues found.
                              </Text>
                            ) : (
                              <VStack
                                align="stretch"
                                gap={2}
                                maxH="240px"
                                overflowY="auto"
                              >
                                {dependencyOptions.map((issueOption) => {
                                  const isSelected =
                                    field.value?.includes(issueOption.id) ??
                                    false
                                  return (
                                    <Button
                                      type="button"
                                      key={issueOption.id}
                                      variant={isSelected ? "solid" : "outline"}
                                      justifyContent="space-between"
                                      onClick={() => {
                                        if (isSelected) {
                                          return
                                        }
                                        const option: IssueOption = {
                                          id: issueOption.id,
                                          title: issueOption.title,
                                          issue_number:
                                            issueOption.issue_number,
                                        }
                                        setSelectedDependencies((prev) => {
                                          if (
                                            prev.some(
                                              (item) => item.id === option.id,
                                            )
                                          ) {
                                            return prev
                                          }
                                          return [...prev, option]
                                        })
                                        field.onChange([
                                          ...(field.value ?? []),
                                          issueOption.id,
                                        ])
                                        setIsDependencyMenuOpen(false)
                                      }}
                                    >
                                      <Flex
                                        direction="column"
                                        align="flex-start"
                                      >
                                        <Text fontWeight="600" truncate>
                                          {issueOption.title}
                                        </Text>
                                        <Text fontSize="xs" color="fg.muted">
                                          #{issueOption.issue_number ?? "—"}
                                        </Text>
                                      </Flex>
                                      {isSelected && <Icon as={FiCheck} />}
                                    </Button>
                                  )
                                })}
                              </VStack>
                            )}
                          </VStack>
                        </MenuContent>
                      </MenuRoot>
                      {selectedDependencies.length > 0 ? (
                        <Wrap>
                          {selectedDependencies.map((dependency) => (
                            <WrapItem key={dependency.id}>
                              <Badge
                                colorPalette="blue"
                                px={2}
                                py={1}
                                borderRadius="full"
                              >
                                <Flex align="center" gap={2}>
                                  <Text fontSize="xs" fontWeight="600">
                                    #{dependency.issue_number ?? "—"}{" "}
                                    {dependency.title}
                                  </Text>
                                  <CloseButton
                                    size="xs"
                                    onClick={() =>
                                      handleDependencyRemove(
                                        dependency.id,
                                        field.onChange,
                                      )
                                    }
                                  />
                                </Flex>
                              </Badge>
                            </WrapItem>
                          ))}
                        </Wrap>
                      ) : (
                        <Text fontSize="sm" color="fg.muted">
                          No dependencies selected.
                        </Text>
                      )}
                    </VStack>
                  )}
                />
              </Field>
              <Field label="Priority" required>
                <Controller
                  control={control}
                  name="priority"
                  rules={{ required: "Priority is required" }}
                  render={({ field }) => (
                    <RadioGroup
                      value={String(field.value ?? 1)}
                      onValueChange={({ value }) =>
                        field.onChange(Number(value ?? 1))
                      }
                    >
                      <Flex direction="column" gap={2}>
                        {PRIORITY_OPTIONS.map((option) => (
                          <Radio
                            key={option.value}
                            value={String(option.value)}
                          >
                            <Flex direction="column" align="flex-start">
                              <Badge
                                colorPalette={option.color}
                                size="sm"
                                mb={1}
                              >
                                {option.label}
                              </Badge>
                              <Text fontSize="xs" color="fg.muted">
                                {option.helper}
                              </Text>
                            </Flex>
                          </Radio>
                        ))}
                      </Flex>
                    </RadioGroup>
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

export default EditIssue
