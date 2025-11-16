import {
  Badge,
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiSearch } from "react-icons/fi"
import { z } from "zod"

import { IssuesService } from "@/client"
import AddIssue from "@/components/Issues/AddIssue"
import PendingItems from "@/components/Pending/PendingItems"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import EditIssue from "@/components/Issues/EditIssue"
import DeleteIssue from "@/components/Issues/DeleteIssue"
import type { IssuePublic } from "@/client"

const issuesSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 10

function getIssuesQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      IssuesService.readIssues({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["issues", { page }],
  }
}

export const Route = createFileRoute("/_layout/issues")({
  component: Issues,
  validateSearch: (search) => issuesSearchSchema.parse(search),
})

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: "gray",
    processing: "blue",
    completed: "green",
    failed: "red",
  }
  return colors[status] || "gray"
}

function IssuesTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()
  const [editingIssue, setEditingIssue] = useState<IssuePublic | null>(null)
  const [deletingIssueId, setDeletingIssueId] = useState<string | null>(null)

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getIssuesQueryOptions({ page }),
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
            <EmptyState.Title>You don't have any issues yet</EmptyState.Title>
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
      <Table.Root size={{ base: "sm", md: "md" }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="sm">Title</Table.ColumnHeader>
            <Table.ColumnHeader w="xs">Issue #</Table.ColumnHeader>
            <Table.ColumnHeader w="xs">Status</Table.ColumnHeader>
            <Table.ColumnHeader w="xs">Priority</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Repository</Table.ColumnHeader>
            <Table.ColumnHeader w="xs">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {issues?.map((issue) => (
            <Table.Row key={issue.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell truncate maxW="sm">
                {issue.title}
              </Table.Cell>
              <Table.Cell>
                {issue.issue_number || "N/A"}
              </Table.Cell>
              <Table.Cell>
                <Badge colorScheme={getStatusColor(issue.status)}>
                  {issue.status}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                {issue.priority}
              </Table.Cell>
              <Table.Cell truncate maxW="sm">
                {issue.repository_url || "N/A"}
              </Table.Cell>
              <Table.Cell>
                <Flex gap={2}>
                  <Button
                    size="sm"
                    onClick={() => setEditingIssue(issue)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => setDeletingIssueId(issue.id)}
                  >
                    Delete
                  </Button>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
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
      
      {editingIssue && (
        <EditIssue
          issue={editingIssue}
          isOpen={!!editingIssue}
          onClose={() => setEditingIssue(null)}
        />
      )}
      
      {deletingIssueId && (
        <DeleteIssue
          id={deletingIssueId}
          isOpen={!!deletingIssueId}
          onClose={() => setDeletingIssueId(null)}
        />
      )}
    </>
  )
}

function Issues() {
  const [isAddOpen, setIsAddOpen] = useState(false)

  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Issues Management
      </Heading>
      <Flex justifyContent="flex-end" mt={4}>
        <Button onClick={() => setIsAddOpen(true)}>
          Add Issue
        </Button>
      </Flex>
      <AddIssue isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <IssuesTable />
    </Container>
  )
}
