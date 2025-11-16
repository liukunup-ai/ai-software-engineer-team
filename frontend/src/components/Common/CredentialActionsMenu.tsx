import {
  Button,
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@chakra-ui/react"
import { useState } from "react"
import { FiEdit, FiMoreHorizontal, FiTrash } from "react-icons/fi"

import type { CredentialPublic } from "@/client"
import DeleteCredential from "@/components/Credentials/DeleteCredential"
import EditCredential from "@/components/Credentials/EditCredential"

interface CredentialActionsMenuProps {
  credential: CredentialPublic
}

export const CredentialActionsMenu = ({ credential }: CredentialActionsMenuProps) => {
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
      <EditCredential
        credential={credential}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
      <DeleteCredential
        id={credential.id}
        title={credential.title}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  )
}