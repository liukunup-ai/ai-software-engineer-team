import { IconButton } from "@chakra-ui/react"
import { useState } from "react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { FiEdit, FiTrash } from "react-icons/fi"
import DeleteNode from "../Nodes/DeleteNode"
import EditNode from "../Nodes/EditNode"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"

interface NodeActionsMenuProps {
  node: any // 可根据实际类型调整
}

export const NodeActionsMenu = ({ node }: NodeActionsMenuProps) => {
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
      <EditNode
        node={node}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
      <DeleteNode
        id={node.id}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      />
    </>
  )
}
