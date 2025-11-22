import { IconButton } from "@chakra-ui/react"
import { useState } from "react"
import { FiEdit, FiTrash } from "react-icons/fi"
import { BsThreeDotsVertical } from "react-icons/bs"

import type { PromptPublic } from "@/client"
import DeletePrompt from "@/components/Prompts/DeletePrompt"
import EditPrompt from "@/components/Prompts/EditPrompt"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"

interface PromptActionsMenuProps {
  prompt: PromptPublic
}

export const PromptActionsMenu = ({ prompt }: PromptActionsMenuProps) => {
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
      <EditPrompt
        prompt={prompt}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
      <DeletePrompt
        id={prompt.id}
        name={prompt.name}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  )
}