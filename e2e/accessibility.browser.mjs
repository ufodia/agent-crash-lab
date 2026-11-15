import {test,expect} from '@playwright/test';
async function tabTo(page,target){for(let i=0;i<90;i++){if(await target.evaluate(el=>el===document.activeElement))return;await page.keyboard.press('Tab');}throw Error('Control is not reachable with Tab');}
test('keyboard simulation reaches the fifth scenario and trace export at 320px reflow',async({page})=>{
  await page.setViewportSize({width:320,height:900});await page.goto('/');const last=page.locator('.scenario').last();await tabTo(page,last);await page.keyboard.press('Enter');await expect(last).toBeFocused();await expect(last).toHaveAttribute('aria-pressed','true');const rect=await last.boundingBox();expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(320);
  expect(await page.locator('#scenarios').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await tabTo(page,page.locator('#step'));await page.keyboard.press('Enter');await expect(page.locator('#step')).toBeFocused();await tabTo(page,page.locator('#export'));const download=page.waitForEvent('download');await page.keyboard.press('Enter');expect((await download).suggestedFilename()).toContain('.json');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
