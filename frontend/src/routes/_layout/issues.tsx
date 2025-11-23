import {
  Badge,
  Container,
  chakra,
  EmptyState,
  Flex,
  Heading,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"

import { type ApiError, type IssuePublic, IssuesService } from "@/client"
import { IssueActionsMenu } from "@/components/Common/IssueActionsMenu"
import AddIssue from "@/components/Issues/AddIssue"
import StartIssueButton from "@/components/Issues/StartIssueButton"
import PendingItems from "@/components/Pending/PendingItems"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import { useProjectContext } from "@/contexts/ProjectContext"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const issuesSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 10

function getIssuesQueryOptions({
  page,
  projectId,
}: {
  page: number
  projectId?: string | null
}) {
  return {
    queryFn: () =>
      IssuesService.readIssues({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        projectId: projectId ?? undefined,
      }),
    queryKey: ["issues", { page, projectId: projectId ?? null }],
  }
}

export const Route = createFileRoute("/_layout/issues")({
  component: Issues,
  validateSearch: (search) => issuesSearchSchema.parse(search),
})

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "待处理",
    processing: "处理中",
    pending_merge: "待合入",
    merged: "已合入",
    terminated: "已终止",
  }
  return labels[status] || status
}

const STATUS_OPTIONS = [
  "pending",
  "processing",
  "pending_merge",
  "merged",
  "terminated",
].map((value) => ({ value, label: getStatusLabel(value) }))

function getPriorityMeta(priority?: number | null) {
  if (priority === null || priority === undefined) {
    return { label: "Not set", color: "gray" }
  }

  if (priority >= 2) {
    return { label: "High", color: "red" }
  }
  if (priority === 1) {
    return { label: "Medium", color: "orange" }
  }

  return { label: "Low", color: "gray" }
}

interface IssueStatusSelectProps {
  issue: IssuePublic
}

function IssueStatusSelect({ issue }: IssueStatusSelectProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const [currentStatus, setCurrentStatus] = useState(issue.status || "pending")

  useEffect(() => {
    setCurrentStatus(issue.status || "pending")
  }, [issue.status])

  const mutation = useMutation({
    mutationFn: (nextStatus: string) =>
      IssuesService.updateIssue({
        id: issue.id,
        requestBody: { status: nextStatus },
      }),
    onSuccess: () => {
      showSuccessToast("Issue status updated.")
    },
    onError: (err: ApiError) => {
      setCurrentStatus(issue.status || "pending")
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] })
    },
  })

  const handleChange = (nextStatus: string) => {
    if (!nextStatus || nextStatus === currentStatus) {
      return
    }
    setCurrentStatus(nextStatus)
    mutation.mutate(nextStatus)
  }

  return (
    <chakra.select
      value={currentStatus}
      onChange={(event) => handleChange(event.target.value)}
      disabled={mutation.isPending}
      fontSize="sm"
      borderRadius="md"
      borderWidth="1px"
      px={2}
      py={1}
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </chakra.select>
  )
}

function IssuesTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()
  const { selectedProjectId, selectedProject } = useProjectContext()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getIssuesQueryOptions({ page, projectId: selectedProjectId }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) => {
    navigate({
      to: "/issues",
      search: (prev) => ({ ...prev, page }),
    })
  }

  const issues = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0
  const projectLabel = selectedProject?.name ?? "all projects"

  if (isLoading) {
    return <PendingItems />
  }

  if (issues.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiSearch />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>
              {selectedProject
                ? `No issues for ${selectedProject.name}`
                : "You don't have any issues yet"}
            </EmptyState.Title>
            <EmptyState.Description>
              Add a new issue to get started
            </EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <>
      <Text fontSize="sm" color="fg.muted" mb={3}>
        Showing issues for {projectLabel}
      </Text>
      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="sm">Title</Table.ColumnHeader>
            <Table.ColumnHeader w="xs">Priority</Table.ColumnHeader>
            <Table.ColumnHeader w="xs">Status</Table.ColumnHeader>
            <Table.ColumnHeader w="xs">Start</Table.ColumnHeader>
            <Table.ColumnHeader w="xs">Action</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {issues?.map((issue) => {
            const priorityMeta = getPriorityMeta(issue.priority)

            return (
              <Table.Row key={issue.id} opacity={isPlaceholderData ? 0.5 : 1}>
                <Table.Cell truncate maxW="sm">
                  {issue.title}
                </Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={priorityMeta.color} variant="subtle">
                    {priorityMeta.label}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <IssueStatusSelect issue={issue} />
                </Table.Cell>
                <Table.Cell>
                  <StartIssueButton issue={issue} />
                </Table.Cell>
                <Table.Cell>
                  <IssueActionsMenu issue={issue} />
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table.Root>
      <Flex justifyContent="flex-end" mt={4}>
        <PaginationRoot
          count={count}
          pageSize={PER_PAGE}
          onPageChange={({ page }) => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </Flex>
        </PaginationRoot>
      </Flex>
    </>
  )
}

function Issues() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Issues Management
      </Heading>
      <AddIssue />
      <IssuesTable />
    </Container>
  )
}
