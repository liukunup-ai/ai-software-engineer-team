import {
  Button,
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@chakra-ui/react"
import { useState } from "react"
import { FiEdit, FiMoreHorizontal, FiTrash } from "react-icons/fi"

import type { ProjectPublic } from "@/client"
import DeleteProject from "@/components/Projects/DeleteProject"
import EditProject from "@/components/Projects/EditProject"

interface ProjectActionsMenuProps {
  project: ProjectPublic
}

export const ProjectActionsMenu = ({ project }: ProjectActionsMenuProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <MenuRoot>
        <MenuTrigger asChild>
          <Button variant="subtle" aria-label="Open actions menu">
            <FiMoreHorizontal />
          </Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem value="edit" onClick={() => setIsEditOpen(true)}>
            <FiEdit fontSize="16px" />
            Edit
          </MenuItem>
          <MenuItem value="delete" onClick={() => setIsDeleteOpen(true)}>
            <FiTrash fontSize="16px" />
            Delete
          </MenuItem>
        </MenuContent>
      </MenuRoot>
      <EditProject
        project={project}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
      <DeleteProject
        id={project.id}
        name={project.name}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  )
}