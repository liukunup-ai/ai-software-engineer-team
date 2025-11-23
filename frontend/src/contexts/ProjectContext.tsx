import { useQuery } from "@tanstack/react-query"
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { type ProjectPublic, ProjectsService } from "@/client"

type ProjectContextValue = {
  projects: ProjectPublic[]
  isLoading: boolean
  isError: boolean
  error: unknown
  selectedProjectId: string | null
  selectedProject?: ProjectPublic
  selectProject: (projectId: string | null) => void
  refresh: () => void
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

const STORAGE_KEY = "selectedProjectId"

const getInitialSelection = () => {
  if (typeof window === "undefined") {
    return null
  }

  return sessionStorage.getItem(STORAGE_KEY)
}

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    getInitialSelection,
  )

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryFn: () => ProjectsService.readProjects({ skip: 0, limit: 100 }),
    queryKey: ["projects"],
    staleTime: 60 * 1000,
  })

  const projects = data?.data ?? []

  const selectedProject = useMemo(() => {
    return projects.find((project) => project.id === selectedProjectId)
  }, [projects, selectedProjectId])

  const persistSelection = useCallback((projectId: string | null) => {
    if (typeof window === "undefined") {
      return
    }

    if (projectId) {
      sessionStorage.setItem(STORAGE_KEY, projectId)
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const selectProject = useCallback(
    (projectId: string | null) => {
      setSelectedProjectId(projectId)
      persistSelection(projectId)
    },
    [persistSelection],
  )

  useEffect(() => {
    // Ensure we always keep a valid project id in sync with the available list.
    if (projects.length === 0) {
      return
    }

    if (!selectedProjectId) {
      selectProject(projects[0].id)
      return
    }

    const match = projects.some((project) => project.id === selectedProjectId)
    if (!match) {
      selectProject(projects[0].id)
    }
  }, [projects, selectProject, selectedProjectId])

  const refresh = useCallback(() => {
    void refetch()
  }, [refetch])

  const value = useMemo<ProjectContextValue>(
    () => ({
      projects,
      isLoading,
      isError,
      error,
      selectedProjectId,
      selectedProject,
      selectProject,
      refresh,
    }),
    [
      projects,
      isLoading,
      isError,
      error,
      selectedProjectId,
      selectedProject,
      selectProject,
      refresh,
    ],
  )

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  )
}

export const useProjectContext = () => {
  const context = useContext(ProjectContext)

  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider")
  }

  return context
}
