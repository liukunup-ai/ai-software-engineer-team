import {
  Icon,
  Input,
  MenuContent,
  MenuRoot,
  MenuTrigger,
  Stack,
  Text,
  Box,
  Flex,
  Separator,
  Button,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { FiChevronDown, FiFolder, FiCheck, FiPlus } from "react-icons/fi"
import { useNavigate } from "@tanstack/react-router"

import { ProjectsService } from "@/client"

const ProjectSelector = () => {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState("")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const { data: projectsData } = useQuery({
    queryFn: () => ProjectsService.readProjects({ skip: 0, limit: 100 }),
    queryKey: ["projects"],
  })

  const projects = projectsData?.data || []

  const filteredProjects = useMemo(() => {
    return projects.filter(project => 
      project.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [projects, searchValue])

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId)
    setSearchValue("")
    setIsOpen(false)
    // Store selected project ID in session storage for cross-component access
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedProjectId", projectId)
    }
  }

  const currentProject = projects.find(p => p.id === selectedProject)

  return (
    <MenuRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)} positioning={{ placement: "bottom-end" }}>
      <MenuTrigger asChild>
        <Flex
          align="center"
          gap={2}
          px={2}
          py={1}
          cursor="pointer"
          borderRadius="md"
          transition="all 0.2s"
          _hover={{ bg: "whiteAlpha.200" }}
          _active={{ bg: "whiteAlpha.300" }}
        >
          <Icon as={FiFolder} fontSize="16px" flexShrink={0} />
          <Text maxW="140px" truncate fontSize="sm">
            {currentProject ? currentProject.name : "Select Project"}
          </Text>
          <Icon as={FiChevronDown} fontSize="14px" flexShrink={0} />
        </Flex>
      </MenuTrigger>
      <MenuContent minW="320px" maxW="420px" p={0} shadow="lg" borderRadius="lg">
        <Stack p={3} gap={3} maxH="400px" overflow="hidden">
          <Box px={1}>
            <Text fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px">
              Search Projects
            </Text>
          </Box>
          <Input
            placeholder="Search by name or description..."
            size="sm"
            borderRadius="md"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)" }}
          />
          <Stack maxH="320px" overflowY="auto" gap={1}>
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <Flex
                  key={project.id}
                  alignItems="center"
                  justifyContent="space-between"
                  p={2.5}
                  borderRadius="md"
                  _hover={{ bg: "gray.50" }}
                  cursor="pointer"
                  onClick={() => handleProjectSelect(project.id)}
                  transition="background-color 0.2s"
                  bg={selectedProject === project.id ? "blue.50" : "transparent"}
                >
                  <Stack gap={0.5} flex="1" minW="0">
                    <Flex alignItems="center" gap={2}>
                      <Text fontWeight="500" fontSize="sm" truncate>
                        {project.name}
                      </Text>
                      {selectedProject === project.id && (
                        <Icon as={FiCheck} color="blue.500" fontSize="16px" flexShrink={0} />
                      )}
                    </Flex>
                    {project.description && (
                      <Text fontSize="xs" color="gray.600" truncate>
                        {project.description}
                      </Text>
                    )}
                  </Stack>
                </Flex>
              ))
            ) : projects.length === 0 ? (
              <Box p={4} textAlign="center">
                <Text fontSize="sm" color="gray.500">
                  No projects available
                </Text>
              </Box>
            ) : (
              <Box p={4} textAlign="center">
                <Text fontSize="sm" color="gray.500">
                  No projects found
                </Text>
              </Box>
            )}
          </Stack>
        </Stack>
        <Separator m={0} />
        <Box p={2}>
          <Button
            w="100%"
            size="sm"
            variant="ghost"
            colorPalette="blue"
            onClick={() => {
              setIsOpen(false)
              navigate({ to: "/projects", search: { page: 1 } })
            }}
            gap={2}
          >
            <FiPlus fontSize="16px" />
            Create Project
          </Button>
        </Box>
      </MenuContent>
    </MenuRoot>
  )
}

export default ProjectSelector