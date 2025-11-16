import {
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiFolder } from "react-icons/fi"
import { z } from "zod"

import { RepositoriesService } from "@/client"
import AddRepository from "@/components/Repositories/AddRepository"
import { RepositoryActionsMenu } from "@/components/Common/RepositoryActionsMenu"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const repositoriesSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getRepositoriesQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      RepositoriesService.readRepositories({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["repositories", { page }],
  }
}

export const Route = createFileRoute("/_layout/repositories")({
  component: Repositories,
  validateSearch: (search) => repositoriesSearchSchema.parse(search),
})

function RepositoriesTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getRepositoriesQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) => {
    navigate({
      to: "/repositories",
      search: (prev) => ({ ...prev, page }),
    })
  }

  const repositories = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <Heading size="sm">Loading...</Heading>
  }

  if (repositories.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiFolder />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>You don't have any repositories yet</EmptyState.Title>
            <EmptyState.Description>
              Add a new repository to get started
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
            <Table.ColumnHeader w="sm">Name</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">URL</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Description</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Public</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {repositories?.map((repository) => (
            <Table.Row key={repository.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell truncate maxW="sm">
                {repository.name}
              </Table.Cell>
              <Table.Cell truncate maxW="sm">
                {repository.url}
              </Table.Cell>
              <Table.Cell
                color={!repository.description ? "gray" : "inherit"}
                truncate
                maxW="30%"
              >
                {repository.description || "N/A"}
              </Table.Cell>
              <Table.Cell>
                {repository.is_public ? "Yes" : "No"}
              </Table.Cell>
              <Table.Cell>
                <RepositoryActionsMenu repository={repository} />
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
    </>
  )
}

function Repositories() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Repositories Management
      </Heading>
      <AddRepository />
      <RepositoriesTable />
    </Container>
  )
}