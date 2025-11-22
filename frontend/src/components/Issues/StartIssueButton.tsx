import { Button } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FiPlay, FiLoader, FiCheckCircle, FiXCircle } from "react-icons/fi"

import type { IssuePublic } from "@/client"
import { IssuesService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"

interface StartIssueButtonProps {
  issue: IssuePublic
}

// CSS for spinning animation
const spinAnimation = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .spin {
    animation: spin 1s linear infinite;
  }
`

export const StartIssueButton = ({ issue }: StartIssueButtonProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [isStarting, setIsStarting] = useState(false)

  const getButtonConfig = () => {
    switch (issue.status) {
      case "pending":
        return {
          icon: <FiPlay />,
          label: "启动",
          colorScheme: "blue",
          isDisabled: false,
        }
      case "processing":
        return {
          icon: <FiLoader className="spin" />,
          label: "运行中",
          colorScheme: "blue",
          isDisabled: true,
        }
      case "pending_merge":
        return {
          icon: <FiCheckCircle />,
          label: "待合入",
          colorScheme: "yellow",
          isDisabled: true,
        }
      case "merged":
        return {
          icon: <FiCheckCircle />,
          label: "已合入",
          colorScheme: "green",
          isDisabled: true,
        }
      case "terminated":
        return {
          icon: <FiXCircle />,
          label: "重新启动",
          colorScheme: "orange",
          isDisabled: false,
        }
      default:
        return {
          icon: <FiPlay />,
          label: "启动",
          colorScheme: "blue",
          isDisabled: false,
        }
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      setIsStarting(true)
      return await IssuesService.startIssueTask({
        id: issue.id,
        requestBody: {},
      })
    },
    onSuccess: () => {
      showSuccessToast("任务已成功启动")
      queryClient.invalidateQueries({ queryKey: ["issues"] })
      setIsStarting(false)
    },
    onError: (error: Error) => {
      showErrorToast(error.message)
      setIsStarting(false)
    },
  })

  const handleStart = () => {
    if (issue.status === "pending" || issue.status === "terminated") {
      mutation.mutate()
    }
  }

  const config = getButtonConfig()

  return (
    <>
      <style>{spinAnimation}</style>
      <Button
        size="sm"
        colorScheme={config.colorScheme}
        onClick={handleStart}
        disabled={config.isDisabled || isStarting}
        loading={isStarting}
      >
        {config.icon}
        {config.label}
      </Button>
    </>
  )
}

export default StartIssueButton
