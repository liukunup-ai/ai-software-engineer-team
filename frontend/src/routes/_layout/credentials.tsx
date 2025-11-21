import {
  Badge,
  Container,
  EmptyState,
  Flex,
  Heading,
  Table,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FiKey } from "react-icons/fi"
import { z } from "zod"

import { type CredentialCategory, CredentialsService } from "@/client"
import { CredentialActionsMenu } from "@/components/Common/CredentialActionsMenu"
import AddCredential from "@/components/Credentials/AddCredential"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"
import {
  getCredentialCategoryLabel,
  maskCredentialPat,
} from "@/constants/credentials"

const credentialsSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getCredentialsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      CredentialsService.readCredentials({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
    queryKey: ["credentials", { page }],
  }
}

export const Route = createFileRoute("/_layout/credentials")({
  component: Credentials,
  validateSearch: (search) => credentialsSearchSchema.parse(search),
})

function CredentialsTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getCredentialsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) => {
    navigate({
      to: "/credentials",
      search: (prev) => ({ ...prev, page }),
    })
  }

  const credentials = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <Heading size="sm">Loading...</Heading>
  }

  if (credentials.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiKey />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>
              You don't have any credentials yet
            </EmptyState.Title>
            <EmptyState.Description>
              Add a new credential to get started
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
            <Table.ColumnHeader w="xs">Category</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">PAT</Table.ColumnHeader>
            <Table.ColumnHeader w="xs">Status</Table.ColumnHeader>
            <Table.ColumnHeader>Nodes</Table.ColumnHeader>
            <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {credentials?.map((credential) => (
            <Table.Row
              key={credential.id}
              opacity={isPlaceholderData ? 0.5 : 1}
            >
              <Table.Cell truncate maxW="sm">
                {credential.title}
              </Table.Cell>
              <Table.Cell>
                <Badge variant="subtle">
                  {getCredentialCategoryLabel(
                    credential.category as CredentialCategory,
                  )}
                </Badge>
              </Table.Cell>
              <Table.Cell truncate maxW="sm">
                {maskCredentialPat(credential.pat)}
              </Table.Cell>
              <Table.Cell>
                <Badge
                  colorPalette={credential.is_disabled ? "red" : "green"}
                  variant="subtle"
                >
                  {credential.is_disabled ? "Disabled" : "Active"}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                {credential.nodes && credential.nodes.length > 0 ? (
                  <Wrap gap={2} maxW="sm">
                    {credential.nodes.map((node) => (
                      <WrapItem key={node.id}>
                        <Badge variant="outline">{node.name}</Badge>
                      </WrapItem>
                    ))}
                  </Wrap>
                ) : (
                  <Text color="fg.muted">Not assigned</Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <CredentialActionsMenu credential={credential} />
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

function Credentials() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Credentials Management
      </Heading>
      <AddCredential />
      <CredentialsTable />
    </Container>
  )
}

export default Credentials
