import {
  Button,
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@chakra-ui/react"
import { useState } from "react"
import { FiEdit, FiMoreHorizontal, FiTrash } from "react-icons/fi"

import type { PromptPublic } from "@/client"
import DeletePrompt from "@/components/Prompts/DeletePrompt"
import EditPrompt from "@/components/Prompts/EditPrompt"

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