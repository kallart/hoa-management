const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/BatchPrintReceipts.tsx', 'utf8');

const mapStart = '{payments.map((payment, index) => {\n';
const beforeMap = content.substring(0, content.indexOf(mapStart) + mapStart.length);
let mapBodyAndAfter = content.substring(content.indexOf(mapStart) + mapStart.length);

const endStr = '        })}\n      </div>\n    </>\n  );\n};\nexport default BatchPrintReceipts;';
const mapBody = mapBodyAndAfter.substring(0, mapBodyAndAfter.lastIndexOf(endStr));
const afterMap = mapBodyAndAfter.substring(mapBodyAndAfter.lastIndexOf(endStr));

const tryWrapped = `          try {\n${mapBody}\n          } catch (e) {
            return (
              <div key={payment.id} className="page-break" style={{ padding: '20px', color: 'red', backgroundColor: '#fee2e2', border: '1px solid #ef4444', margin: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>Error rendering payment {payment.id}</h3>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px', margin: 0 }}>
                  {e instanceof Error ? e.message + '\\n' + e.stack : String(e)}
                </pre>
              </div>
            );
          }\n`;

fs.writeFileSync('frontend/src/pages/BatchPrintReceipts.tsx', beforeMap + tryWrapped + afterMap);
console.log('try/catch added!');
