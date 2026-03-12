"""
Script de teste para Google Gemini API GRÁTIS
"""

from dotenv import load_dotenv
import os
import google.generativeai as genai

print("=" * 70)
print("🎯 TESTE DE CONFIGURAÇÃO - Google Gemini API (GRÁTIS!)")
print("=" * 70)
print()

# 1. Carregar variáveis de ambiente
print("1️⃣  Carregando arquivo .env...")
load_dotenv()
api_key = os.getenv("GOOGLE_GEMINI_API_KEY")

# 2. Verificar se a chave foi carregada
print()
if api_key:
    print("✅ Chave Gemini carregada com sucesso!")
    print(f"   Primeiros 15 caracteres: {api_key[:15]}...")
    print(f"   Últimos 5 caracteres: ...{api_key[-5:]}")
    print(f"   Comprimento total: {len(api_key)} caracteres")
else:
    print("❌ Chave NÃO encontrada!")
    print("   Verifique se .env foi criado corretamente")
    print()
    print("   Você pode gerar uma chave gratuita em:")
    print("   → https://ai.google.dev/")
    exit(1)

# 3. Testar conexão com API
print()
print("2️⃣  Testando conexão com Google Gemini API...")
print()

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    print("   Enviando mensagem de teste...")
    response = model.generate_content("Diga apenas a palavra 'Funcionando!' nada mais")
    
    response_text = response.text
    print()
    print("✅ Google Gemini API está FUNCIONANDO PERFEITAMENTE!")
    print(f"   Resposta: {response_text}")
    print()
    print("=" * 70)
    print("✓ TUDO OK! Você pode rodar os testes agora:")
    print()
    print("   Opção 1: Usar Gemini (GRÁTIS) - Adapte browser.py")
    print("   Opção 2: Usar Claude - Adicione créditos primeiro")
    print()
    print("=" * 70)
    
except Exception as e:
    print()
    print(f"❌ ERRO ao conectar com Gemini: {e}")
    print()
    print("=" * 70)
    print("💡 POSSÍVEIS SOLUÇÕES:")
    print()
    
    error_str = str(e).lower()
    
    if "api key" in error_str or "invalid" in error_str:
        print("  1. ❌ Chave inválida ou não encontrada")
        print("     → Gerar chave em: https://ai.google.dev/")
        print("     → Adicionar em .env: GOOGLE_GEMINI_API_KEY=sua_chave_aqui")
    
    elif "quota" in error_str or "rate limit" in error_str:
        print("  1. ⏱️ Rate limit atingido")
        print("     → Aguarde alguns minutos")
        print("     → Tente novamente")
    
    elif "connection" in error_str or "network" in error_str:
        print("  1. 🌐 Problema de conexão de rede")
        print("     → Verifique sua conexão internet")
        print("     → Tente novamente")
    
    elif "model" in error_str:
        print("  1. 🤖 Modelo não disponível")
        print("     → Tente com: 'gemini-1.5-pro', 'gemini-1.5-flash'")
    
    print()
    print("=" * 70)
    exit(1)
