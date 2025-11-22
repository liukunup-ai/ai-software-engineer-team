import { IconButton } from "@chakra-ui/react"
import { useState } from "react"
import { FiEdit, FiTrash } from "react-icons/fi"
import { BsThreeDotsVertical } from "react-icons/bs"

import type { ProjectPublic } from "@/client"
import DeleteProject from "@/components/Projects/DeleteProject"
import EditProject from "@/components/Projects/EditProject"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"

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
          <IconButton variant="ghost" color="inherit" aria-label="Open actions menu">
            <BsThreeDotsVertical />
          </IconButton>
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