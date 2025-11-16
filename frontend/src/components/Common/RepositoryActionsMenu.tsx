import {
  Button,
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@chakra-ui/react"
import { useState } from "react"
import { FiEdit, FiMoreHorizontal, FiTrash } from "react-icons/fi"

import type { RepositoryPublic } from "@/client"
import DeleteRepository from "@/components/Repositories/DeleteRepository"
import EditRepository from "@/components/Repositories/EditRepository"

interface RepositoryActionsMenuProps {
  repository: RepositoryPublic
}

export const RepositoryActionsMenu = ({ repository }: RepositoryActionsMenuProps) => {
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
          <MenuItem
            onClick={() => setIsEditOpen(true)}
            icon={<FiEdit fontSize="16px" />}
          >
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => setIsDeleteOpen(true)}
            icon={<FiTrash fontSize="16px" />}
          >
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