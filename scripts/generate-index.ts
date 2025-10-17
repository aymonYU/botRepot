/**
 * 手动生成报告索引页面
 * 
 * 使用方法：
 * bun run scripts/generate-index.ts
 */

import { ReportIndexGenerator } from '../src/utils/report-index';
import { join } from 'path';

const reportsDir = join(process.cwd(), 'reports');

console.log('📊 开始生成报告索引页面...');
console.log(`📁 报告目录: ${reportsDir}\n`);

try {
  const generator = new ReportIndexGenerator(reportsDir);
  generator.generateIndex();
  
  console.log('\n✅ 索引页面生成成功！');
  console.log(`\n🌐 打开浏览器访问: ${join(reportsDir, 'index.html')}`);
  console.log('或运行: open reports/index.html\n');
  
} catch (error) {
  console.error('\n❌ 生成索引页面失败:', error);
  process.exit(1);
}

