import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import EditNode from "../Nodes/EditNode"
import DeleteNode from "../Nodes/DeleteNode"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"

interface NodeActionsMenuProps {
  node: any // 可根据实际类型调整
}

export const NodeActionsMenu = ({ node }: NodeActionsMenuProps) => {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditNode node={node} />
        <DeleteNode id={node.id} />
      </MenuContent>
    </MenuRoot>
  )
}
