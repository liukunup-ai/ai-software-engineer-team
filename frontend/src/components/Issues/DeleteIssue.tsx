import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { type ApiError, IssuesService } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

interface DeleteIssueProps {
  id: string
  isOpen: boolean
  onClose: () => void
}

const DeleteIssue = ({ id, isOpen, onClose }: DeleteIssueProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()

  const deleteIssue = async (id: string) => {
    await IssuesService.deleteIssue({ id })
  }

  const mutation = useMutation({
    mutationFn: deleteIssue,
    onSuccess: () => {
      showToast("Success", "Issue deleted successfully.", "success")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] })
    },
  })

  const onDelete = () => {
    mutation.mutate(id)
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Issue</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to delete this issue?</Text>
            <Text color="ui.danger" mt={2}>
              This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button
              variant="danger"
              onClick={onDelete}
              isLoading={mutation.isPending}
            >
              Delete
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default DeleteIssue
