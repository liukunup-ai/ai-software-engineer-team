import { IconButton } from "@chakra-ui/react"
import { useState } from "react"
import { FiEdit, FiTrash } from "react-icons/fi"
import { BsThreeDotsVertical } from "react-icons/bs"

import type { IssuePublic } from "@/client"
import DeleteIssue from "@/components/Issues/DeleteIssue"
import EditIssue from "@/components/Issues/EditIssue"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"

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
