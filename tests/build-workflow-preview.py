"""Build a local-only copy using synthetic data, never a real Supabase session."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = (root / 'cloud-ui-v12.html').read_text(encoding='utf-8')
real_import = "import{createClient}from'https://esm.sh/@supabase/supabase-js@2.117.2';"
if source.count(real_import) != 1:
    raise SystemExit('Supabase import changed: review fixture isolation before building.')
source = source.replace(real_import, "import{createClient}from'./tests/customer-workflow-fixture.js?v=20261020b';")
source = source.replace('<head>', '<head><base href="../">', 1)
(root / 'output').mkdir(exist_ok=True)
(root / 'output/customer-workflow-preview.html').write_text(source, encoding='utf-8')
print('Local synthetic preview: /output/customer-workflow-preview.html')
