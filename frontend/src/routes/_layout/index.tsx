import {
  Box,
  Container,
  Text,
  SimpleGrid,
  Card,
  Flex,
  Heading,
  Table,
  Badge,
  Spinner,
  Center,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FiCheckCircle, FiClock, FiDatabase, FiServer } from "react-icons/fi"

import { DashboardService } from "@/client"
import type { DashboardStats } from "@/client"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function StatCard({
  title,
  value,
  subtitle,
  icon,
  colorScheme = "blue",
}: {
  title: string
  value: number
  subtitle?: string
  icon: React.ReactNode
  colorScheme?: string
}) {
  return (
    <Card.Root>
      <Card.Body>
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="sm" color="gray.500" mb={1}>
              {title}
            </Text>
            <Text fontSize="3xl" fontWeight="bold">
              {value}
            </Text>
            {subtitle && (
              <Text fontSize="sm" color="gray.600" mt={1}>
                {subtitle}
              </Text>
            )}
          </Box>
          <Box fontSize="3xl" color={`${colorScheme}.500`}>
            {icon}
          </Box>
        </Flex>
      </Card.Body>
    </Card.Root>
  )
}

function Dashboard() {
  const { user: currentUser } = useAuth()

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => DashboardService.getDashboardStats(),
    refetchInterval: 10000, // 每10秒刷新一次
  })

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" />
      </Center>
    )
  }

  return (
    <Container maxW="full">
      <Box pt={12} m={4}>
        <Text fontSize="2xl" fontWeight="bold" mb={2}>
          Hi, {currentUser?.full_name || currentUser?.email} 👋🏼
        </Text>
        <Text color="gray.600" mb={8}>
          {currentUser?.is_superuser
            ? "管理员视图 - 显示所有用户的统计数据"
            : "欢迎回来！"}
        </Text>

        {/* 统计卡片 */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} gap={6} mb={8}>
          <StatCard
            title="Issues"
            value={stats?.issues.total || 0}
            subtitle={`${stats?.issues.pending || 0} pending / ${stats?.issues.processing || 0} processing`}
            icon={<FiCheckCircle />}
            colorScheme="blue"
          />
          <StatCard
            title="Nodes"
            value={stats?.nodes.total || 0}
            subtitle={`${stats?.nodes.idle || 0} idle / ${stats?.nodes.running || 0} running / ${stats?.nodes.offline || 0} offline`}
            icon={<FiServer />}
            colorScheme="green"
          />

        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
          <StatCard
            title="Projects"
            value={stats?.projects_count || 0}
            icon={<FiDatabase />}
            colorScheme="purple"
          />
          <StatCard
            title="Repositories"
            value={stats?.repositories_count || 0}
            icon={<FiDatabase />}
            colorScheme="orange"
          />
          <StatCard
            title="Credentials"
            value={stats?.credentials_count || 0}
            icon={<FiClock />}
            colorScheme="pink"
          />
          <StatCard
            title="Prompts"
            value={stats?.prompts_count || 0}
            icon={<FiClock />}
            colorScheme="cyan"
          />
        </SimpleGrid>

        {/* 运行中的任务 */}
        {stats?.running_tasks && stats.running_tasks.length > 0 && (
          <Box mt={8}>
            <Heading size="lg" mb={4}>
              运行中的任务
            </Heading>
            <Card.Root>
              <Card.Body p={0}>
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Issue</Table.ColumnHeader>
                      <Table.ColumnHeader>节点</Table.ColumnHeader>
                      <Table.ColumnHeader>运行时间</Table.ColumnHeader>
                      <Table.ColumnHeader>状态</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {stats.running_tasks.map((task) => (
                      <Table.Row key={task.task_id}>
                        <Table.Cell>
                          <Text fontWeight="medium" truncate maxW="sm">
                            {task.issue_title}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge colorScheme="blue">{task.node_name}</Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm" color="gray.600">
                            {task.running_time}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge colorScheme="green">运行中</Badge>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Card.Body>
            </Card.Root>
          </Box>
        )}

        {/* 无运行任务时的提示 */}
        {stats?.running_tasks && stats.running_tasks.length === 0 && (
          <Box mt={8}>
            <Heading size="lg" mb={4}>
              运行中的任务
            </Heading>
            <Card.Root>
              <Card.Body>
                <Text color="gray.500" textAlign="center" py={8}>
                  当前没有运行中的任务
                </Text>
              </Card.Body>
            </Card.Root>
          </Box>
        )}
      </Box>
    </Container>
  )
}

