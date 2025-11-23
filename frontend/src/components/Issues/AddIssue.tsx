import {
  Badge,
  Button,
  CloseButton,
  DialogActionTrigger,
  DialogTitle,
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
import { FaPlus } from "react-icons/fa"
import { FiCheck, FiChevronDown, FiFolder, FiLink } from "react-icons/fi"

import {
  type ApiError,
  type IssueCreate,
  type IssuePublic,
  type IssuesReadIssuesResponse,
  IssuesService,
  type ProjectPublic,
  type ProjectsReadProjectsResponse,
  ProjectsService,
} from "@/client"
import { useProjectContext } from "@/contexts/ProjectContext"
import useCustomToast from "@/hooks/useCustomToast"
import { useDebounce } from "@/hooks/useDebounce"
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
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"
import { Radio, RadioGroup } from "../ui/radio"

type IssueCreateForm = {
  title: string
  description?: string | null
  priority: number
  project_id?: string | null
  repository_url?: string | null
  dependency_issue_ids: string[]
}

type ProjectOption = Pick<ProjectPublic, "id" | "name" | "description">
type IssueOption = Pick<IssuePublic, "id" | "title" | "issue_number">

const PRIORITY_OPTIONS = [
  { label: "High", helper: "Blocking issues", value: 2, color: "red" },
  { label: "Medium", helper: "Important soon", value: 1, color: "orange" },
  { label: "Low", helper: "Nice to have", value: 0, color: "gray" },
]

const MAX_SEARCH_RESULTS = 20

const AddIssue = () => {
  const [isOpen, setIsOpen] = useState(false)
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

  const formDefaults = useMemo<IssueCreateForm>(
    () => ({
      title: "",
      description: "",
      priority: 1,
      project_id: null,
      repository_url: "",
      dependency_issue_ids: [],
    }),
    [],
  )

  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const { selectedProject } = useProjectContext()

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isValid },
  } = useForm<IssueCreateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: formDefaults,
  })

  const resetFormState = useCallback(() => {
    reset(formDefaults)
    setProjectSearch("")
    setDependencySearch("")
    setSelectedProjectOption(null)
    setSelectedDependencies([])
  }, [formDefaults, reset])

  const handleDialogChange = useCallback(
    ({ open }: { open: boolean }) => {
      setIsOpen(open)
      if (!open) {
        resetFormState()
      }
    },
    [resetFormState],
  )

  useEffect(() => {
    if (!isOpen || !selectedProject) {
      return
    }

    const currentProjectId = getValues("project_id")
    if (!currentProjectId) {
      setValue("project_id", selectedProject.id)
      setSelectedProjectOption({
        id: selectedProject.id,
        name: selectedProject.name,
        description: selectedProject.description,
      })
    }
  }, [getValues, isOpen, selectedProject, setValue])

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

  const mutation = useMutation({
    mutationFn: (data: IssueCreateForm) => {
      const repositoryUrl = data.repository_url?.trim()
      const payload: IssueCreate = {
        ...data,
        project_id: data.project_id || undefined,
        dependency_issue_ids: data.dependency_issue_ids ?? [],
        description: data.description || undefined,
        repository_url:
          repositoryUrl && repositoryUrl.length > 0 ? repositoryUrl : undefined,
      }
      return IssuesService.createIssue({ requestBody: payload })
    },
    onSuccess: () => {
      showSuccessToast("Issue created successfully.")
      resetFormState()
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

  const handleDependencyRemove = (
    issueId: string,
    onChange: (value: string[]) => void,
  ) => {
    const remaining = selectedDependencies.filter((item) => item.id !== issueId)
    setSelectedDependencies(remaining)
    onChange(remaining.map((item) => item.id))
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={handleDialogChange}
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
            <Text mb={4}>
              Provide enough context so the automation can prioritize correctly.
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
                  placeholder="Summarize the issue"
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
                  placeholder="Add the background, context, or acceptance criteria"
                  rows={4}
                />
              </Field>
              <Field
                invalid={!!errors.repository_url}
                errorText={errors.repository_url?.message}
                label="Repository URL"
              >
                <Input
                  {...register("repository_url", {
                    pattern: {
                      value: /^https?:\/\/.+/i,
                      message: "Enter a valid URL.",
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
                              placeholder="Search issue title or repo"
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
                                {dependencyOptions.map((issue) => {
                                  const isSelected =
                                    field.value?.includes(issue.id) ?? false
                                  return (
                                    <Button
                                      type="button"
                                      key={issue.id}
                                      variant={isSelected ? "solid" : "outline"}
                                      justifyContent="space-between"
                                      onClick={() => {
                                        if (isSelected) {
                                          return
                                        }
                                        const issueOption: IssueOption = {
                                          id: issue.id,
                                          title: issue.title,
                                          issue_number: issue.issue_number,
                                        }
                                        const updated = [
                                          ...selectedDependencies,
                                          issueOption,
                                        ]
                                        setSelectedDependencies(updated)
                                        field.onChange([
                                          ...(field.value ?? []),
                                          issue.id,
                                        ])
                                        setIsDependencyMenuOpen(false)
                                      }}
                                    >
                                      <Flex
                                        direction="column"
                                        align="flex-start"
                                      >
                                        <Text fontWeight="600" truncate>
                                          {issue.title}
                                        </Text>
                                        <Text fontSize="xs" color="fg.muted">
                                          #{issue.issue_number ?? "—"}
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
                          {selectedDependencies.map((issue) => (
                            <WrapItem key={issue.id}>
                              <Badge
                                colorPalette="blue"
                                px={2}
                                py={1}
                                borderRadius="full"
                              >
                                <Flex align="center" gap={2}>
                                  <Text fontSize="xs" fontWeight="600">
                                    #{issue.issue_number ?? "—"} {issue.title}
                                  </Text>
                                  <CloseButton
                                    size="xs"
                                    onClick={() =>
                                      handleDependencyRemove(
                                        issue.id,
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
