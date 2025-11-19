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

import { ProjectsService } from "@/client"
import AddProject from "@/components/Projects/AddProject"
import { ProjectActionsMenu } from "@/components/Common/ProjectActionsMenu"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination.tsx"

const projectsSearchSchema = z.object({
  page: z.number().catch(1),
})

const PER_PAGE = 5

function getProjectsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      ProjectsService.readProjects({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["projects", { page }],
  }
}

export const Route = createFileRoute("/_layout/projects")({
  component: Projects,
  validateSearch: (search) => projectsSearchSchema.parse(search),
})

function ProjectsTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getProjectsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const setPage = (page: number) => {
    navigate({
      to: "/projects",
      search: (prev) => ({ ...prev, page }),
    })
  }

  const projects = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <Heading size="sm">Loading...</Heading>
  }

  if (projects.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <FiFolder />
          </EmptyState.Indicator>
          <VStack textAlign="center">
            <EmptyState.Title>You don't have any projects yet</EmptyState.Title>
            <EmptyState.Description>
              Add a new project to get started
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
            <Table.ColumnHeader w="sm">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {projects?.map((project) => (
            <Table.Row key={project.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell truncate maxW="sm">
                {project.name}
              </Table.Cell>
              <Table.Cell
                color={!project.description ? "gray" : "inherit"}
                truncate
                maxW="30%"
              >
                {project.description || "N/A"}
              </Table.Cell>
              <Table.Cell>
                <ProjectActionsMenu project={project} />
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

function Projects() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Projects Management
      </Heading>
      <AddProject />
      <ProjectsTable />
    </Container>
  )
}