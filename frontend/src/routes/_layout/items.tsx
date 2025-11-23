import { Box, Container, Heading, Text } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/items")({
  component: Items,
})

function Items() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Items Management
      </Heading>
      <Box
        mt={8}
        borderWidth="1px"
        borderRadius="md"
        borderColor="border.subtle"
        p={4}
        bg="bg.surface"
      >
        <Text fontWeight="semibold" mb={1}>
          Items feature deprecated
        </Text>
        <Text color="fg.muted" fontSize="sm">
          Please use Projects and Issues to manage work. This legacy section
          remains only for backward compatibility.
        </Text>
      </Box>
    </Container>
  )
}
