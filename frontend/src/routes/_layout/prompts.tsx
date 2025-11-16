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
import { FiMessageSquare } from "react-icons/fi"
import { z } from "zod"

import { PromptsService } from "@/client"
import AddPrompt from "@/components/Prompts/AddPrompt"
import { PromptActionsMenu } from "@/components/Common/PromptActionsMenu"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const promptsSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getPromptsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      PromptsService.readPrompts({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["prompts", { page }],
  }
}

export const Route = createFileRoute("/_layout/prompts")({
  component: Prompts,
  validateSearch: (search) => promptsSearchSchema.parse(search),
})

function PromptsTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getPromptsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) => {
    navigate({
      to: "/prompts",
      search: (prev) => ({ ...prev, page }),
    })
  }

  const prompts = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <Heading size="sm">Loading...</Heading>
  }

  if (prompts.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiMessageSquare />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>You don't have any prompts yet</EmptyState.Title>
            <EmptyState.Description>
              Add a new prompt to get started
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
            <Table.ColumnHeader w="sm">Description</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Tags</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {prompts?.map((prompt) => (
            <Table.Row key={prompt.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell truncate maxW="sm">
                {prompt.name}
              </Table.Cell>
              <Table.Cell
                color={!prompt.description ? "gray" : "inherit"}
                truncate
                maxW="30%"
              >
                {prompt.description || "N/A"}
              </Table.Cell>
              <Table.Cell
                color={!prompt.tags ? "gray" : "inherit"}
                truncate
                maxW="30%"
              >
                {prompt.tags || "N/A"}
              </Table.Cell>
              <Table.Cell>
                <PromptActionsMenu prompt={prompt} />
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

function Prompts() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Prompts Management
      </Heading>
      <AddPrompt />
      <PromptsTable />
    </Container>
  )
}