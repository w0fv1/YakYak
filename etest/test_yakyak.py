import subprocess
import time
import unittest
import urllib.request

try:
    from playwright.sync_api import sync_playwright
except ImportError:  # pragma: no cover
    sync_playwright = None


BASE_URL = "http://127.0.0.1:4173/"


class YakYakE2ETest(unittest.TestCase):
    server: subprocess.Popen | None = None
    playwright = None
    browser = None

    @classmethod
    def setUpClass(cls):
        if sync_playwright is None:
            raise unittest.SkipTest("Install Playwright first: pip install playwright && playwright install chromium")

        subprocess.run(["corepack", "pnpm", "build"], check=True)
        cls.server = subprocess.Popen(
            ["corepack", "pnpm", "preview", "--", "--host", "127.0.0.1", "--port", "4173"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        deadline = time.time() + 20
        while time.time() < deadline:
            try:
                with urllib.request.urlopen(BASE_URL, timeout=1) as response:
                    if response.status == 200:
                        break
            except OSError:
                time.sleep(0.2)
        else:
            cls.tearDownClass()
            raise RuntimeError("Preview server did not start")

        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch()

    @classmethod
    def tearDownClass(cls):
        if cls.browser:
            cls.browser.close()
        if cls.playwright:
            cls.playwright.stop()
        if cls.server:
            cls.server.terminate()
            cls.server.wait(timeout=10)

    def new_page(self):
        context = self.browser.new_context()
        page = context.new_page()
        page.goto(BASE_URL)
        return context, page

    def test_default_timer_and_first_onboarding(self):
        context, page = self.new_page()
        try:
            self.assertTrue(page.get_by_text("说词儿啊！").is_visible())
            self.assertTrue(page.get_by_text("帮主播盯住说话节奏").is_visible())
            page.get_by_role("button", name="Close").click()
            self.assertTrue(page.get_by_text("8").first.is_visible())

            page.reload()
            self.assertFalse(page.get_by_text("帮主播盯住说话节奏").is_visible())
        finally:
            context.close()

    def test_system_dialog_has_install_and_help(self):
        context, page = self.new_page()
        try:
            page.get_by_role("button", name="系统").click()
            self.assertTrue(page.get_by_role("heading", name="系统").is_visible())
            self.assertTrue(page.get_by_role("button", name="添加到主屏幕 浏览器菜单也可以添加").is_visible())
            self.assertTrue(page.get_by_role("button", name="引导 / 帮助 重新查看 YakYak 的使用方式").is_visible())
        finally:
            context.close()

    def test_data_dialog_has_import_and_export(self):
        context, page = self.new_page()
        try:
            page.get_by_role("button", name="导入导出数据").click()
            self.assertTrue(page.get_by_role("heading", name="词库数据").is_visible())
            self.assertTrue(page.get_by_role("button", name="导入词库 选择 YakYak 导出的 JSON 文件").is_visible())
            self.assertTrue(page.get_by_role("button", name="导出词库 下载当前流程词和万能句").is_visible())
        finally:
            context.close()


if __name__ == "__main__":
    unittest.main()
