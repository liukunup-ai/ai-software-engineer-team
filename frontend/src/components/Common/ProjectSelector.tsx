import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Input,
  MenuPositioner,
  MenuContent,
  MenuRoot,
  MenuTrigger,
  Portal,
  Separator,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import {
  FiAlertCircle,
  FiCheck,
  FiChevronDown,
  FiFolder,
  FiPlus,
  FiRefreshCcw,
} from "react-icons/fi"

import { useProjectContext } from "@/contexts/ProjectContext"

const ProjectSelector = () => {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const {
    projects,
    isLoading,
    isError,
    error,
    selectedProject,
    selectProject,
    refresh,
  } = useProjectContext()

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()
    if (!normalizedSearch) {
      return projects
    }

    return projects.filter(project => {
      const nameMatch = project.name.toLowerCase().includes(normalizedSearch)
      const descriptionMatch = project.description?.toLowerCase().includes(normalizedSearch)
      return nameMatch || descriptionMatch
    })
  }, [projects, searchValue])

  const handleProjectSelect = (projectId: string) => {
    selectProject(projectId)
    setSearchValue("")
    setIsOpen(false)
  }

  const handleOpenChange = (event: { open: boolean }) => {
    setIsOpen(event.open)
    if (!event.open) {
      setSearchValue("")
    }
  }

  const menuLabel = isError
    ? "Projects unavailable"
    : selectedProject?.name ?? (isLoading ? "Loading projects..." : "Select Project")
  const errorMessage = error instanceof Error ? error.message : "Something went wrong"
  const canSearchProjects = !isLoading && !isError && projects.length > 0
  const searchPlaceholder = isError
    ? "Search unavailable"
    : isLoading
      ? "Loading projects..."
      : projects.length === 0
        ? "No projects available"
        : "Search by name or description..."

  useEffect(() => {
    if (!canSearchProjects && searchValue) {
      setSearchValue("")
    }
  }, [canSearchProjects, searchValue])

  const triggerHoverBg = "teal.600"
  const triggerActiveBg = "teal.700"
  const highlightBg = "teal.50"
  const highlightBorder = "teal.200"
  const itemHoverBg = "teal.100"
  const iconColor = "teal.600"
  const metaColor = "gray.500"
  const projectCount = projects.length

  return (
    <MenuRoot
      open={isOpen}
      onOpenChange={handleOpenChange}
      positioning={{ placement: "bottom-end", gutter: 6 }}
    >
      <MenuTrigger asChild>
        <Button
          variant="solid"
          colorPalette="teal"
          size="md"
          gap={2}
          px={3}
          fontWeight="600"
          borderRadius="md"
          _hover={{ bg: triggerHoverBg, color: "white" }}
          _active={{ bg: triggerActiveBg, color: "white" }}
          display="inline-flex"
          alignItems="center"
          minW="auto"
          color="white"
        >
          <Icon as={FiFolder} fontSize="18px" />
          <Text maxW="140px" truncate fontSize="sm">
            {menuLabel}
          </Text>
          <Icon as={FiChevronDown} fontSize="18px" />
        </Button>
      </MenuTrigger>
      <Portal>
        <MenuPositioner>
          <MenuContent
            minW="320px"
            maxW="420px"
            minH="320px"
            p={0}
            shadow="xl"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="border.subtle"
            bg="bg.panel"
          >
            <Stack p={3} gap={3} maxH="400px" overflow="hidden">
              <HStack justify="space-between" align="flex-start">
                <Stack gap={0}>
                  <Text fontWeight="600" fontSize="sm">
                    Projects
                  </Text>
                  <Text fontSize="xs" color={metaColor}>
                    Choose where to work next
                  </Text>
                </Stack>
                <Badge variant="solid" colorPalette="teal">
                  {projectCount}
                </Badge>
              </HStack>
              <Box px={1} opacity={canSearchProjects ? 1 : 0.6}>
                <Text fontSize="xs" fontWeight="600" color={metaColor} textTransform="uppercase" letterSpacing="0.5px">
                  Search Projects
                </Text>
              </Box>
              <Input
                placeholder={searchPlaceholder}
                size="sm"
                borderRadius="md"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)" }}
                disabled={!canSearchProjects}
              />
              <Stack maxH="320px" overflowY="auto" gap={1}>
                {isLoading ? (
                  <Flex align="center" justify="center" py={8} gap={2} color="gray.500">
                    <Spinner size="sm" />
                    <Text fontSize="sm">Loading projects…</Text>
                  </Flex>
                ) : isError ? (
                  <Stack align="center" textAlign="center" p={6} gap={3}>
                    <Icon as={FiAlertCircle} fontSize="28px" color="red.400" />
                    <Stack gap={1}>
                      <Text fontWeight="600">Unable to load projects</Text>
                      <Text fontSize="sm" color="gray.600">
                        {errorMessage}
                      </Text>
                    </Stack>
                    <Button size="sm" variant="outline" onClick={() => refresh()} gap={2}>
                      <Icon as={FiRefreshCcw} />
                      Try again
                    </Button>
                  </Stack>
                ) : projects.length === 0 ? (
                  <Box p={4} textAlign="center">
                    <Text fontSize="sm" color="gray.500">
                      No projects available
                    </Text>
                  </Box>
                ) : filteredProjects.length === 0 ? (
                  <Box p={4} textAlign="center">
                    <Text fontSize="sm" color="gray.500">
                      No projects found
                    </Text>
                  </Box>
                ) : (
                  filteredProjects.map(project => (
                    <Flex
                      key={project.id}
                      alignItems="center"
                      justifyContent="space-between"
                      p={2.5}
                      borderRadius="md"
                      borderWidth={selectedProject?.id === project.id ? "1px" : "0px"}
                      borderColor={selectedProject?.id === project.id ? highlightBorder : "transparent"}
                      bg={selectedProject?.id === project.id ? highlightBg : "transparent"}
                      _hover={{ bg: itemHoverBg }}
                      cursor="pointer"
                      onClick={() => handleProjectSelect(project.id)}
                      transition="background-color 0.2s"
                      gap={3}
                    >
                      <Icon as={FiFolder} fontSize="18px" color={iconColor} />
                      <Stack gap={0.5} flex="1" minW="0">
                        <Flex alignItems="center" gap={2}>
                          <Text fontWeight="500" fontSize="sm" truncate>
                            {project.name}
                          </Text>
                          {selectedProject?.id === project.id && (
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
                borderRadius="md"
                borderWidth="1px"
                borderColor="transparent"
                _hover={{ bg: "blue.50", borderColor: "blue.100" }}
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
        </MenuPositioner>
      </Portal>
    </MenuRoot>
  )
}

export default ProjectSelector