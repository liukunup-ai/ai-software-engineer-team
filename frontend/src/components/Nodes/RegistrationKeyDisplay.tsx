import { Box, Button, Code, Heading, HStack, IconButton, Stack, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { FaKey, FaCopy, FaCheck } from "react-icons/fa"

import { NodesService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { DialogBody, DialogCloseTrigger, DialogContent, DialogHeader, DialogRoot, DialogTitle, DialogTrigger } from "../ui/dialog"

const RegistrationKeyDisplay = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedCommand, setCopiedCommand] = useState(false)
  const { showSuccessToast } = useCustomToast()

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-key"],
    queryFn: () => NodesService.getRegistrationKey(),
    enabled: isOpen, // 只有打开对话框时才查询
  })

  if (error) {
    handleError(error as ApiError)
  }

  const copyToClipboard = async (text: string, type: 'key' | 'command') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'key') {
        setCopiedKey(true)
        setTimeout(() => setCopiedKey(false), 2000)
      } else {
        setCopiedCommand(true)
        setTimeout(() => setCopiedCommand(false), 2000)
      }
      showSuccessToast("已复制到剪贴板")
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <DialogRoot size={{ base: "sm", md: "xl" }} placement="center" open={isOpen} onOpenChange={({ open }) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="outline" colorPalette="blue">
          <FaKey fontSize="16px" />
          节点注册
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>节点注册信息</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {isLoading ? (
            <Text>加载中...</Text>
          ) : data ? (
            <Stack gap={4}>
              <Box>
                <Heading size="sm" mb={2}>注册密钥</Heading>
                <HStack>
                  <Code 
                    flex={1} 
                    p={2} 
                    borderRadius="md" 
                    fontSize="sm"
                    wordBreak="break-all"
                  >
                    {data.registration_key}
                  </Code>
                  <IconButton 
                    aria-label="复制密钥"
                    onClick={() => copyToClipboard(data.registration_key, 'key')}
                    colorPalette={copiedKey ? "green" : "gray"}
                  >
                    {copiedKey ? <FaCheck /> : <FaCopy />}
                  </IconButton>
                </HStack>
              </Box>

              <Box>
                <Heading size="sm" mb={2}>Docker 部署命令</Heading>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  在从节点服务器上运行以下命令来注册节点：
                </Text>
                <Box position="relative">
                  <Code 
                    display="block"
                    p={3}
                    borderRadius="md"
                    fontSize="xs"
                    whiteSpace="pre-wrap"
                    wordBreak="break-all"
                  >
                    {data.docker_command}
                  </Code>
                  <IconButton
                    aria-label="复制命令"
                    position="absolute"
                    top={2}
                    right={2}
                    size="sm"
                    onClick={() => copyToClipboard(data.docker_command, 'command')}
                    colorPalette={copiedCommand ? "green" : "gray"}
                  >
                    {copiedCommand ? <FaCheck /> : <FaCopy />}
                  </IconButton>
                </Box>
              </Box>

              <Box bg="blue.50" p={3} borderRadius="md">
                <Text fontSize="sm" color="blue.800">
                  <strong>说明：</strong>从节点在启动时会自动注册到主节点，并定期发送心跳信息更新状态。
                  请确保从节点可以访问主节点的网络地址。
                </Text>
              </Box>
            </Stack>
          ) : null}
        </DialogBody>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default RegistrationKeyDisplay
