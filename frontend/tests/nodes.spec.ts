import { expect, test } from "@playwright/test"

// 节点管理页面基本端到端测试

test.describe("Node Management", () => {
  test("should add, edit, and delete a node", async ({ page }) => {
    await page.goto("http://localhost:3000/nodes")
    // 新增节点
    await page.click('button[value="add-node"]')
    await page.fill('input[name="name"]', "test-node")
    await page.fill('input[name="ip"]', "192.168.1.100")
    await page.fill('input[name="description"]', "自动化测试节点")
    await page.fill('input[name="tags"]', "test,auto")
    await page.click('button[type="submit"]')
    await expect(page.locator("text=test-node")).toBeVisible()

    // 编辑节点
    await page.click('button:has-text("Edit Node")')
    await page.fill('input[name="description"]', "已编辑")
    await page.click('button[type="submit"]')
    await expect(page.locator("text=已编辑")).toBeVisible()

    // 删除节点
    await page.click('button:has-text("Delete Node")')
    await page.click('button:has-text("Delete Node")') // 确认删除
    await expect(page.locator("text=test-node")).not.toBeVisible()
  })
})
