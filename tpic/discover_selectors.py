#!/usr/bin/env python3
"""
🔍 Assistente para Descobrir Seletores de Navegação
Teste seletores em tempo real contra o site rodando
"""

import asyncio
import sys
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout


class SelectorTester:
    def __init__(self, page_url: str):
        self.page_url = page_url
        self.page = None
        self.browser = None
    
    async def start(self):
        """Inicia navegador"""
        p = async_playwright()
        self.playwright = await p.start()
        self.browser = await self.playwright.chromium.launch(headless=False)
        self.page = await self.browser.new_page()
        await self.page.goto(self.page_url, wait_until="networkidle")
        print(f"\n✅ Página aberta: {self.page_url}")
    
    async def test_selector(self, selector: str) -> bool:
        """Testa se um seletor existe na página"""
        try:
            element = await self.page.wait_for_selector(selector, timeout=2000)
            if element:
                text = await element.text_content()
                print(f"✅ ENCONTRADO: {selector}")
                if text:
                    print(f"   Texto: '{text.strip()}'")
                return True
        except PlaywrightTimeout:
            print(f"❌ NÃO ENCONTRADO: {selector}")
            return False
        except Exception as e:
            print(f"⚠️  ERRO ao testar: {selector}")
            print(f"   {str(e)[:100]}")
            return False
    
    async def click_and_navigate(self, selector: str) -> bool:
        """Clica num seletor e aguarda navegação"""
        try:
            if await self.test_selector(selector):
                print(f"   Clicando em: {selector}")
                await self.page.click(selector)
                await asyncio.sleep(2)
                new_url = self.page.url
                print(f"   Novo URL: {new_url}")
                return True
        except Exception as e:
            print(f"   ❌ Erro ao clicar: {e}")
        return False
    
    async def get_all_buttons(self) -> list:
        """Lista todos os botões e links da página"""
        buttons = await self.page.query_selector_all("button")
        links = await self.page.query_selector_all("a")
        
        all_elements = buttons + links
        print(f"\n📋 Encontrados {len(buttons)} botões e {len(links)} links:\n")
        
        results = []
        for i, elem in enumerate(all_elements, 1):
            text = await elem.text_content()
            tag = await elem.evaluate("el => el.tagName")
            classes = await elem.evaluate("el => el.className")
            href = await elem.evaluate("el => el.getAttribute('href')")
            
            text = text.strip()[:50] if text else "[sem texto]"
            
            # Gerar seletor recomendado
            if tag == "BUTTON":
                selector = f"button:has-text('{text}')"
            else:
                if href:
                    selector = f"a[href='{href}']"
                else:
                    selector = f"a:has-text('{text}')"
            
            print(f"{i:2}. [{tag}] {text}")
            print(f"    Seletor: {selector}")
            if href:
                print(f"    Href: {href}")
            if classes:
                print(f"    Classes: {classes}")
            print()
            
            results.append({
                "tag": tag,
                "text": text if text != "[sem texto]" else "",
                "selector": selector,
                "href": href,
                "classes": classes
            })
        
        return results
    
    async def close(self):
        """Fecha navegador"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    async def interactive_test(self):
        """Modo interativo - teste seletores"""
        await self.start()
        
        while True:
            print("\n" + "="*60)
            print("🔍 TESTADOR DE SELETORES - Opções:")
            print("="*60)
            print("1. Testar um seletor")
            print("2. Clicar num seletor (com navegação)")
            print("3. Listar todos os botões/links")
            print("4. Voltar para URL anterior")
            print("5. Ir para nova página")
            print("0. Sair")
            print("="*60)
            
            choice = input("Escolha: ").strip()
            
            if choice == "1":
                selector = input("Seletor (ex: button:has-text('Paroquias')): ").strip()
                if selector:
                    await self.test_selector(selector)
            
            elif choice == "2":
                selector = input("Seletor para clicar: ").strip()
                if selector:
                    await self.click_and_navigate(selector)
            
            elif choice == "3":
                await self.get_all_buttons()
            
            elif choice == "4":
                try:
                    await self.page.go_back()
                    await asyncio.sleep(1)
                    print(f"Voltou para: {self.page.url}")
                except:
                    print("Não há página anterior")
            
            elif choice == "5":
                url = input("Nova URL: ").strip()
                if url:
                    await self.page.goto(url, wait_until="networkidle")
                    print(f"Navegou para: {self.page.url}")
            
            elif choice == "0":
                break
        
        await self.close()


async def main():
    print("\n" + "="*60)
    print("🔍 TESTADOR DE SELETORES PARA TPIC")
    print("="*60)
    print("\nEste assistente ajuda a descobrir seletores CSS")
    print("para usar nas Fases 3, 4 e 5 do TPIC\n")
    
    # Detectar qual página testar
    print("Qual página deseja testar?")
    print("1. Homepage (http://localhost:5173)")
    print("2. Admin Site Login (http://localhost:5173/admin-site/login)")
    print("3. Admin Site Dashboard (http://localhost:5173/admin-site/dashboard)")
    print("4. Admin Paróquia Login (http://localhost:5173/admin-paroquia/login)")
    print("5. Signup (http://localhost:5173/signup)")
    print("6. Outra URL")
    
    choice = input("\nEscolha (1-6): ").strip()
    
    urls = {
        "1": "http://localhost:5173",
        "2": "http://localhost:5173/admin-site/login",
        "3": "http://localhost:5173/admin-site/dashboard",
        "4": "http://localhost:5173/admin-paroquia/login",
        "5": "http://localhost:5173/signup",
    }
    
    url = urls.get(choice)
    if not url:
        url = input("Digite a URL: ").strip()
    
    if not url.startswith("http"):
        print("URL inválida!")
        return
    
    tester = SelectorTester(url)
    try:
        await tester.interactive_test()
    except KeyboardInterrupt:
        print("\n\nInterrompido pelo usuário")
        await tester.close()
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        await tester.close()


if __name__ == "__main__":
    asyncio.run(main())
