import { Container, EmptyState, Flex, Heading, Table, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiServer } from "react-icons/fi"
import { z } from "zod"

import { NodesService } from "@/client" // 需要在后端 OpenAPI 中生成对应 client
import AddNode from "@/components/Nodes/AddNode"
import EditNode from "@/components/Nodes/EditNode"
import DeleteNode from "@/components/Nodes/DeleteNode"
import RegistrationKeyDisplay from "@/components/Nodes/RegistrationKeyDisplay"
import { PaginationItems, PaginationNextTrigger, PaginationPrevTrigger, PaginationRoot } from "@/components/ui/pagination.tsx"

const nodesSearchSchema = z.object({ page: z.number().catch(1) })
const PER_PAGE = 5

function getNodesQueryOptions({ page }: { page: number }) {
  return { queryFn: () => NodesService.readNodes({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }), queryKey: ["nodes", { page }] }
}

export const Route = createFileRoute("/_layout/nodes")({ component: Nodes, validateSearch: (search) => nodesSearchSchema.parse(search) })

function NodesTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()
  const { data, isLoading, isPlaceholderData } = useQuery({ ...getNodesQueryOptions({ page }), placeholderData: (prevData) => prevData })

  const setPage = (page: number) => { navigate({ to: "/nodes", search: (prev) => ({ ...prev, page }) }) }

  const nodes = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <Heading size="sm">Loading...</Heading>
  }

  if (nodes.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator><FiServer /></EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>No nodes registered yet</EmptyState.Title>
            <EmptyState.Description>Add a node to start managing resources</EmptyState.Description>
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
            <Table.ColumnHeader w="xs">Name</Table.ColumnHeader>
            <Table.ColumnHeader w="xs">IP</Table.ColumnHeader>
            <Table.ColumnHeader w="24">Status</Table.ColumnHeader>
            <Table.ColumnHeader w="xs">Last Heartbeat</Table.ColumnHeader>
            <Table.ColumnHeader w="xs">Tags</Table.ColumnHeader>
            <Table.ColumnHeader w="32">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {nodes.map((node) => (
            <Table.Row key={node.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell truncate maxW="xs">{node.name}</Table.Cell>
              <Table.Cell truncate maxW="xs">{node.ip}</Table.Cell>
              <Table.Cell truncate maxW="24" color={!node.status ? "gray" : "inherit"}>{node.status || "N/A"}</Table.Cell>
              <Table.Cell truncate maxW="xs" fontSize="xs" color={!node.last_heartbeat ? "gray" : "inherit"}>
                {node.last_heartbeat ? new Date(node.last_heartbeat).toLocaleString('zh-CN') : "从未连接"}
              </Table.Cell>
              <Table.Cell truncate maxW="xs" color={!node.tags ? "gray" : "inherit"}>{node.tags || "N/A"}</Table.Cell>
              <Table.Cell><EditNode node={node} /> <DeleteNode id={node.id} /></Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Flex justifyContent="flex-end" mt={4}>
        <PaginationRoot count={count} pageSize={PER_PAGE} onPageChange={({ page }) => setPage(page)}>
          <Flex><PaginationPrevTrigger /><PaginationItems /><PaginationNextTrigger /></Flex>
        </PaginationRoot>
      </Flex>
    </>
  )
}

function Nodes() {
  return (
    <Container maxW="full">
      <Flex justifyContent="space-between" alignItems="center" pt={12}>
        <Heading size="lg">Nodes Management</Heading>
        <RegistrationKeyDisplay />
      </Flex>
      <AddNode />
      <NodesTable />
    </Container>
  )
}
