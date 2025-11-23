import { IconButton } from "@chakra-ui/react"
import { useState } from "react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { FiEdit, FiTrash } from "react-icons/fi"

import type { RepositoryPublic } from "@/client"
import DeleteRepository from "@/components/Repositories/DeleteRepository"
import EditRepository from "@/components/Repositories/EditRepository"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"

interface RepositoryActionsMenuProps {
  repository: RepositoryPublic
}

export const RepositoryActionsMenu = ({
  repository,
}: RepositoryActionsMenuProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <MenuRoot>
        <MenuTrigger asChild>
          <IconButton
            variant="ghost"
            color="inherit"
            aria-label="Open actions menu"
          >
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
      <EditRepository
        repository={repository}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
      <DeleteRepository
        id={repository.id}
        name={repository.name}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  )
}
