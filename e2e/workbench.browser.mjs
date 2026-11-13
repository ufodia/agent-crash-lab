import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

async function getDownload(page,button){
  const wait=page.waitForEvent('download');
  await button.click();
  const download=await wait;
  return {download,content:await readFile(await download.path(),'utf8')};
}

test('local workbench: analysis, evidence, export and responsive layout',async({page},testInfo)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const done=[];
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang','en');
      for(let n=0;n<6;n++)await page.locator('#step').click();await expect(page.locator('#naive-effects')).toHaveText('2');await expect(page.locator('#safe-effects')).toHaveText('1');
      const exported=await getDownload(page,page.locator('#export'));expect(JSON.parse(exported.content).format).toBe('agent-crash-lab/1');
      await page.locator('#reset').click();await expect(page.locator('#naive-effects')).toHaveText('0');
      await page.locator('#trace-file').setInputFiles({name:'trace.json',mimeType:'application/json',buffer:Buffer.from(exported.content)});await expect(page.locator('#left-name')).toHaveText('Imported evidence');
      await page.locator('.scenario').nth(1).click();for(let n=0;n<6;n++)await page.locator('#step').click();
      done.push('Naive duplicate vs guarded single commit','Reset','Real exported trace replay','Scenario switch');
  await page.screenshot({path:testInfo.outputPath('desktop.png'),fullPage:false});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:testInfo.outputPath('mobile.png'),fullPage:false});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1)).toBe(false);
  expect(errors).toEqual([]);
});

test('a delayed trace cannot replace a newer scenario selection',async({page})=>{
  await page.addInitScript(()=>{
    const original=File.prototype.text;
    File.prototype.text=async function(){
      if(this.name==='delayed.json')await new Promise(resolve=>{window.releaseImport=resolve;});
      const text=await original.call(this);window.importReadFinished=true;return text;
    };
  });
  await page.goto('/');
  const trace={format:'agent-crash-lab/1',scenario:'timeout-after-commit',policy:'safe',snapshots:[{event:{step:1,label:'Imported',detail:'Pending old import',tone:'info',node:'agent'},effects:[],value:'Imported',violations:0}]};
  await page.locator('#trace-file').setInputFiles({name:'delayed.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(trace))});
  await expect.poll(()=>page.evaluate(()=>typeof window.releaseImport)).toBe('function');
  await page.locator('.scenario').nth(1).click();
  await page.evaluate(()=>window.releaseImport());
  await expect.poll(()=>page.evaluate(()=>window.importReadFinished)).toBe(true);
  await expect(page.locator('#scenario-caption')).toHaveText('DUPLICATE DELIVERY');
  await expect(page.locator('#left-name')).toHaveText('Naive policy');
});
