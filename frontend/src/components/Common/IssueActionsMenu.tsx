import {
  Button,
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@chakra-ui/react"
import { useState } from "react"
import { FiEdit, FiMoreHorizontal, FiTrash } from "react-icons/fi"

import type { IssuePublic } from "@/client"
import DeleteIssue from "@/components/Issues/DeleteIssue"
import EditIssue from "@/components/Issues/EditIssue"

interface IssueActionsMenuProps {
  issue: IssuePublic
}

export const IssueActionsMenu = ({ issue }: IssueActionsMenuProps) => {
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
      <EditIssue
        issue={issue}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
      <DeleteIssue
        id={issue.id}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  )
}

export default IssueActionsMenu
