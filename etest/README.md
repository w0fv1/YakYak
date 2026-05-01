# YakYak E2E Tests

Python E2E tests use Playwright against the production preview build.

```bash
pip install playwright
playwright install chromium
python -m unittest etest/test_yakyak.py
```
