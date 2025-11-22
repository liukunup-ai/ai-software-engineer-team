import { IconButton } from "@chakra-ui/react"
import { useState } from "react"
import { FiEdit, FiTrash } from "react-icons/fi"
import { BsThreeDotsVertical } from "react-icons/bs"

import type { CredentialPublic } from "@/client"
import DeleteCredential from "@/components/Credentials/DeleteCredential"
import EditCredential from "@/components/Credentials/EditCredential"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"

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